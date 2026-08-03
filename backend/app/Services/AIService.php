<?php

namespace App\Services;

use App\Models\Truck;
use App\Models\Trip;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;

class AIService
{
    /**
     * Intenta llamar al servicio de IA (Python). Devuelve null si no responde
     * o si la configuración está deshabilitada, de modo que el llamador pueda
     * recurrir a la lógica heurística en PHP.
     */
    protected function callPythonService(string $endpoint, array $payload): ?array
    {
        if (!config('services.ai_service.enabled')) {
            return null;
        }

        $baseUrl = config('services.ai_service.url');
        if (empty($baseUrl) || $baseUrl === 'http://localhost') {
            return null;
        }

        try {
            $response = Http::acceptJson()
                ->timeout(config('services.ai_service.timeout'))
                ->post(rtrim($baseUrl, '/') . $endpoint, $payload);

            if ($response->successful()) {
                $data = $response->json();
                return is_array($data) ? $data : null;
            }
        } catch (\Throwable $e) {
            // Servicio no disponible: se usa el fallback heurístico.
        }

        return null;
    }
    /**
     * Predict next maintenance based on mileage and history
     */
    public function predictMaintenance(string $truckId): array
    {
        $truck = Truck::with(['maintenanceHistory', 'trips'])->find($truckId);

        if (!$truck) {
            throw new \Exception('Camión no encontrado');
        }

        // Intentar primero con el servicio Python (ML).
        $pythonPrediction = $this->callPythonService('/api/ai/predict-maintenance', $this->buildTruckPayload($truck));
        if ($pythonPrediction !== null) {
            return $this->buildPredictionResult($truck, $pythonPrediction, 'ml_regression');
        }

        // Fallback heurístico en PHP.
        return $this->predictMaintenanceHeuristic($truck);
    }

    /**
     * Payload del camión para el predictor Python.
     */
    protected function buildTruckPayload(Truck $truck): array
    {
        $lastService = $truck->maintenanceHistory()->orderBy('service_date', 'desc')->first();

        return [
            'current_km' => $truck->current_mileage ?? 0,
            'age_years' => $this->truckAge($truck),
            'trip_frequency_monthly' => $this->monthlyTripFrequency($truck),
            'avg_load_tons' => $truck->average_load ?? 0,
            'last_service_km' => $lastService?->mileage_at_service ?? 0,
            'maintenance_interval_km' => 15000,
        ];
    }

    protected function truckAge(Truck $truck): int
    {
        try {
            if (!empty($truck->year)) {
                return max(0, (int) date('Y') - (int) $truck->year);
            }
        } catch (\Throwable $e) {
            // ignora
        }
        return 0;
    }

    protected function monthlyTripFrequency(Truck $truck): int
    {
        return $truck->trips()
            ->where('created_at', '>=', now()->subDays(30))
            ->count();
    }

    /**
     * Convierte la respuesta del servicio Python al formato del panel.
     */
    protected function buildPredictionResult(Truck $truck, array $pred, string $method): array
    {
        $kmUntil = (int) ($pred['predicted_km_until_service'] ?? 0);
        $current = $truck->current_mileage ?? 0;
        $severity = 'low';
        $alert = false;
        $message = 'Mantenimiento programado';

        if ($kmUntil <= 0) {
            $severity = 'critical';
            $alert = true;
            $message = 'Mantenimiento VENCIDO. Requiere atención inmediata.';
        } elseif ($kmUntil < 200) {
            $severity = 'high';
            $alert = true;
            $message = "Mantenimiento urgente: {$kmUntil} km restantes";
        } elseif ($kmUntil < 500) {
            $severity = 'medium';
            $alert = true;
            $message = "Mantenimiento sugerido en {$kmUntil} km";
        } else {
            $message = "Próximo mantenimiento en {$kmUntil} km";
        }

        return [
            'truck_id' => $truck->id,
            'truck_plate' => $truck->plate,
            'current_mileage' => $current,
            'next_service_km' => $current + max(0, $kmUntil),
            'km_until_service' => max(0, $kmUntil),
            'estimated_date' => $pred['predicted_date'] ?? now()->addDays(30)->toDateString(),
            'alert' => $alert,
            'severity' => $severity,
            'message' => $message,
            'avg_km_between_services' => 15000,
            'last_service_date' => $truck->maintenanceHistory()->orderBy('service_date', 'desc')->first()?->service_date,
            'recommended_actions' => $pred['recommended_actions'] ?? $this->getRecommendedActions($severity, $kmUntil),
            'confidence' => $pred['confidence'] ?? null,
            'method' => $method,
        ];
    }

    public function predictMaintenanceHeuristic(Truck $truck): array
    {

        $truckId = $truck->id;
        $maintenanceHistory = $truck->maintenanceHistory()
            ->orderBy('service_date', 'desc')
            ->get();

        $currentMileage = $truck->current_mileage ?? 0;

        if ($maintenanceHistory->isEmpty()) {
            return $this->generateDefaultPrediction($truck, $currentMileage);
        }

        $avgKmBetween = $this->calculateAverageKmBetweenServices($maintenanceHistory);
        $lastServiceMileage = $maintenanceHistory->first()->mileage_at_service ?? 0;
        $nextServiceKm = $lastServiceMileage + $avgKmBetween;
        $kmUntilService = $nextServiceKm - $currentMileage;

        $severity = 'low';
        $alert = false;
        $message = 'Mantenimiento programado';

        if ($kmUntilService <= 0) {
            $severity = 'critical';
            $alert = true;
            $message = 'Mantenimiento VENCIDO. Requiere atención inmediata.';
        } elseif ($kmUntilService < 200) {
            $severity = 'high';
            $alert = true;
            $message = "Mantenimiento urgente: {$kmUntilService} km restantes";
        } elseif ($kmUntilService < 500) {
            $severity = 'medium';
            $alert = true;
            $message = "Mantenimiento sugerido en {$kmUntilService} km";
        } else {
            $message = "Próximo mantenimiento en {$kmUntilService} km";
        }

        $estimatedDate = $this->estimateDateFromKm($kmUntilService, $truckId);

        return [
            'truck_id' => $truckId,
            'truck_plate' => $truck->plate,
            'current_mileage' => $currentMileage,
            'next_service_km' => $nextServiceKm,
            'km_until_service' => max(0, $kmUntilService),
            'estimated_date' => $estimatedDate,
            'alert' => $alert,
            'severity' => $severity,
            'message' => $message,
            'avg_km_between_services' => $avgKmBetween,
            'last_service_date' => $maintenanceHistory->first()->service_date,
            'recommended_actions' => $this->getRecommendedActions($severity, $kmUntilService),
        ];
    }

    /**
     * Get maintenance predictions for all active trucks
     */
    public function getFleetPredictions(): array
    {
        $trucks = Truck::where('status', 'active')->get();
        $predictions = [];

        foreach ($trucks as $truck) {
            try {
                $predictions[] = $this->predictMaintenance($truck->id);
            } catch (\Exception $e) {
                $predictions[] = [
                    'truck_id' => $truck->id,
                    'truck_plate' => $truck->plate,
                    'error' => $e->getMessage(),
                ];
            }
        }

        usort($predictions, function ($a, $b) {
            return ($a['km_until_service'] ?? 999999) <=> ($b['km_until_service'] ?? 999999);
        });

        return $predictions;
    }

    /**
     * Predict trip cost based on distance and material
     */
    public function predictTripCost(array $tripData): array
    {
        $py = $this->callPythonService('/api/ai/predict-cost', $tripData);
        if ($py !== null) {
            return $this->buildCostResult($tripData, $py);
        }

        return $this->predictTripCostHeuristic($tripData);
    }

    /**
     * Convierte la respuesta del servicio Python de costos al formato del panel.
     */
    protected function buildCostResult(array $tripData, array $py): array
    {
        $breakdown = $py['breakdown'] ?? [];
        $totalCost = (float) ($breakdown['total'] ?? $py['total_cost'] ?? 0);
        $weight = (float) ($tripData['weight'] ?? 0);
        $pricePerTon = $this->getMaterialPrice($tripData['material_type'] ?? 'Caliza');
        $estimatedRevenue = $weight * $pricePerTon;
        $estimatedProfit = $estimatedRevenue - $totalCost;
        $profitMargin = $estimatedRevenue > 0 ? ($estimatedProfit / $estimatedRevenue) * 100 : 0;

        return [
            'estimated_cost' => round($totalCost, 2),
            'cost_breakdown' => [
                'fuel' => round((float) ($breakdown['fuel'] ?? 0), 2),
                'driver' => round((float) ($breakdown['driver'] ?? 0), 2),
                'maintenance' => round((float) ($breakdown['maintenance'] ?? 0), 2),
                'tolls' => round((float) ($breakdown['tolls'] ?? 0), 2),
            ],
            'cost_per_ton' => round($weight > 0 ? $totalCost / $weight : 0, 2),
            'estimated_revenue' => round($estimatedRevenue, 2),
            'estimated_profit' => round($estimatedProfit, 2),
            'profit_margin' => round($profitMargin, 1),
            'recommendation' => $profitMargin >= 15 ? 'Viaje rentable' : 'Considerar ajustar precio',
            'method' => 'ml',
        ];
    }

    public function predictTripCostHeuristic(array $tripData): array
    {
        $distance = $tripData['distance'] ?? 0;
        $materialType = $tripData['material_type'] ?? 'Caliza';
        $weight = $tripData['weight'] ?? 0;

        $fuelCostPerKm = 8.5;
        $driverCostPerKm = 3.2;
        $maintenanceCostPerKm = 1.8;
        $tollCostPerKm = 0.5;

        $totalFuelCost = $distance * $fuelCostPerKm;
        $totalDriverCost = $distance * $driverCostPerKm;
        $totalMaintenanceCost = $distance * $maintenanceCostPerKm;
        $totalTollCost = $distance * $tollCostPerKm;

        $totalCost = $totalFuelCost + $totalDriverCost + $totalMaintenanceCost + $totalTollCost;
        $costPerTon = $weight > 0 ? $totalCost / $weight : 0;

        $pricePerTon = $this->getMaterialPrice($materialType);
        $estimatedRevenue = $weight * $pricePerTon;
        $estimatedProfit = $estimatedRevenue - $totalCost;
        $profitMargin = $estimatedRevenue > 0 ? ($estimatedProfit / $estimatedRevenue) * 100 : 0;

        return [
            'estimated_cost' => round($totalCost, 2),
            'cost_breakdown' => [
                'fuel' => round($totalFuelCost, 2),
                'driver' => round($totalDriverCost, 2),
                'maintenance' => round($totalMaintenanceCost, 2),
                'tolls' => round($totalTollCost, 2),
            ],
            'cost_per_ton' => round($costPerTon, 2),
            'estimated_revenue' => round($estimatedRevenue, 2),
            'estimated_profit' => round($estimatedProfit, 2),
            'profit_margin' => round($profitMargin, 1),
            'recommendation' => $profitMargin >= 15 ? 'Viaje rentable' : 'Considerar ajustar precio',
        ];
    }

    private function calculateAverageKmBetweenServices($maintenanceHistory): float
    {
        if ($maintenanceHistory->count() < 2) {
            return 15000;
        }

        $totalKm = 0;
        $count = 0;

        for ($i = 0; $i < $maintenanceHistory->count() - 1; $i++) {
            $km1 = $maintenanceHistory[$i]->mileage_at_service ?? 0;
            $km2 = $maintenanceHistory[$i + 1]->mileage_at_service ?? 0;
            if ($km1 > $km2) {
                $totalKm += ($km1 - $km2);
                $count++;
            }
        }

        return $count > 0 ? $totalKm / $count : 15000;
    }

    private function generateDefaultPrediction(Truck $truck, int $currentMileage): array
    {
        $nextServiceKm = $currentMileage + 15000;
        $kmUntilService = 15000;

        return [
            'truck_id' => $truck->id,
            'truck_plate' => $truck->plate,
            'current_mileage' => $currentMileage,
            'next_service_km' => $nextServiceKm,
            'km_until_service' => $kmUntilService,
            'estimated_date' => now()->addDays(30)->toDateString(),
            'alert' => false,
            'severity' => 'low',
            'message' => 'Sin historial. Mantenimiento estimado en 15,000 km.',
            'avg_km_between_services' => 15000,
            'last_service_date' => null,
            'recommended_actions' => ['Registrar primer mantenimiento'],
        ];
    }

    private function estimateDateFromKm(float $kmUntilService, string $truckId): string
    {
        $recentTrips = Trip::where('truck_id', $truckId)
            ->where('created_at', '>=', now()->subDays(30))
            ->get();

        $avgKmPerDay = 100;
        if ($recentTrips->isNotEmpty()) {
            $totalKm = $recentTrips->sum('distance');
            $avgKmPerDay = $totalKm / 30;
        }

        $daysUntilService = $avgKmPerDay > 0 ? $kmUntilService / $avgKmPerDay : 30;

        return now()->addDays((int) $daysUntilService)->toDateString();
    }

    private function getRecommendedActions(string $severity, float $kmUntilService): array
    {
        $actions = [];

        if ($severity === 'critical') {
            $actions[] = 'Programar mantenimiento INMEDIATO';
            $actions[] = 'Revisar niveles de aceite y frenos';
            $actions[] = 'Considerar sacar camión de circulación';
        } elseif ($severity === 'high') {
            $actions[] = 'Programar mantenimiento esta semana';
            $actions[] = 'Revisar sistema de enfriamiento';
            $actions[] = 'Verificar presión de llantas';
        } elseif ($severity === 'medium') {
            $actions[] = 'Agendar mantenimiento próximo';
            $actions[] = 'Revisar filtros y aceite';
        } else {
            $actions[] = 'Mantenimiento preventivo normal';
        }

        return $actions;
    }

    private function getMaterialPrice(string $materialType): float
    {
        $prices = [
            'Caliza' => 350,
            'Arena' => 280,
            'Grava' => 320,
            'Sascalilla' => 300,
            'Relleno' => 250,
        ];

        return $prices[$materialType] ?? 300;
    }

    /**
     * Optimize route between two points
     */
    public function optimizeRoute(array $routeData): array
    {
        $origin = $routeData['origin'] ?? '';
        $destination = $routeData['destination'] ?? '';
        $materialType = $routeData['material_type'] ?? 'Caliza';
        $weight = $routeData['weight'] ?? 0;
        $departureTime = $routeData['departure_time'] ?? '06:00';

        // Intentar con el servicio Python para un cálculo más preciso.
        $py = $this->callPythonService('/api/ai/optimize-route', $this->buildRoutePayload($routeData));
        if ($py !== null) {
            return $this->buildRouteResult($py, $origin, $destination, $materialType, $weight, $departureTime);
        }

        return $this->optimizeRouteHeuristic($routeData);
    }

    /**
     * Convierte el payload de ruta (origen/destino en texto) al formato que
     * espera el servicio Python (objetos con lat/lng).
     */
    protected function buildRoutePayload(array $routeData): array
    {
        $origin = $routeData['origin'] ?? '';
        $destination = $routeData['destination'] ?? '';

        $coords = [
            'Cantera Penonomé' => ['lat' => 8.5190, 'lng' => -80.3570],
            'Cantera El Coco' => ['lat' => 8.5300, 'lng' => -80.3400],
            'Cantera Río Grande' => ['lat' => 8.4900, 'lng' => -80.3900],
            'Cantera Norte' => ['lat' => 8.5450, 'lng' => -80.3700],
            'Cantera Sur' => ['lat' => 8.4600, 'lng' => -80.3300],
            'Cantera Centro' => ['lat' => 8.5100, 'lng' => -80.3550],
            'Cantera' => ['lat' => 8.5190, 'lng' => -80.3570],
            'Planta de Producción' => ['lat' => 8.5000, 'lng' => -80.3650],
            'Planta' => ['lat' => 8.5000, 'lng' => -80.3650],
            'Bodega Central' => ['lat' => 8.5050, 'lng' => -80.3750],
            'Centro' => ['lat' => 8.9833, 'lng' => -79.5167],
            'Norte' => ['lat' => 9.3590, 'lng' => -79.9000],
            'Sur' => ['lat' => 8.4030, 'lng' => -78.1450],
            'Industrial' => ['lat' => 9.3200, 'lng' => -79.8800],
            'Puerto' => ['lat' => 9.3410, 'lng' => -79.9010],
            'Obra' => ['lat' => 8.9833, 'lng' => -79.5200],
            'Chitré' => ['lat' => 7.9620, 'lng' => -80.4290],
            'Las Tablas' => ['lat' => 7.7640, 'lng' => -80.2740],
            'Santiago' => ['lat' => 8.1060, 'lng' => -80.9890],
            'David' => ['lat' => 8.4270, 'lng' => -82.4310],
            'La Chorrera' => ['lat' => 8.8800, 'lng' => -79.7830],
            'Colón' => ['lat' => 9.3590, 'lng' => -79.9000],
            'Penonomé' => ['lat' => 8.5190, 'lng' => -80.3570],
            'La Palma' => ['lat' => 8.4100, 'lng' => -78.1500],
            'Bocas del Toro' => ['lat' => 9.3400, 'lng' => -82.2420],
            'El Porvenir' => ['lat' => 9.5550, 'lng' => -78.9500],
        ];

        $provinceCities = [
            'Herrera' => ['lat' => 7.9620, 'lng' => -80.4290],
            'Los Santos' => ['lat' => 7.7640, 'lng' => -80.2740],
            'Veraguas' => ['lat' => 8.1060, 'lng' => -80.9890],
            'Chiriquí' => ['lat' => 8.4270, 'lng' => -82.4310],
            'Panamá Oeste' => ['lat' => 8.8800, 'lng' => -79.7830],
            'Panamá' => ['lat' => 8.9833, 'lng' => -79.5167],
            'Colón' => ['lat' => 9.3590, 'lng' => -79.9000],
            'Coclé' => ['lat' => 8.5190, 'lng' => -80.3570],
            'Darién' => ['lat' => 8.4100, 'lng' => -78.1500],
            'Bocas del Toro' => ['lat' => 9.3400, 'lng' => -82.2420],
            'Guna Yala' => ['lat' => 9.5550, 'lng' => -78.9500],
        ];

        $resolve = function (string $name) use ($coords, $provinceCities) {
            foreach ($coords as $key => $c) {
                if (stripos($name, $key) !== false) {
                    return $c;
                }
            }
            foreach ($provinceCities as $key => $c) {
                if (stripos($name, $key) !== false) {
                    return $c;
                }
            }
            return ['lat' => 8.5, 'lng' => -80.5];
        };

        return [
            'origin' => $resolve($origin),
            'destination' => $resolve($destination),
            'constraints' => [
                'truck_weight_tons' => (float) ($routeData['weight'] ?? 0),
                'route_type' => $routeData['route_type'] ?? 'standard',
                'hour_of_day' => ($routeData['departure_time'] ?? null)
                    ? (int) explode(':', $routeData['departure_time'])[0]
                    : now()->hour,
            ],
        ];
    }

    protected function optimizeRouteHeuristic(array $routeData): array
    {
        $origin = $routeData['origin'] ?? '';
        $destination = $routeData['destination'] ?? '';
        $materialType = $routeData['material_type'] ?? 'Caliza';
        $weight = $routeData['weight'] ?? 0;
        $departureTime = $routeData['departure_time'] ?? '06:00';

        $distance = $this->estimateDistance($origin, $destination);
        $duration = $this->estimateDuration($distance);
        $fuelNeeded = $this->estimateFuel($distance, $weight);

        $departureHour = (int) explode(':', $departureTime)[0];
        $isPeakHour = ($departureHour >= 7 && $departureHour <= 9) || ($departureHour >= 17 && $departureHour <= 19);
        $trafficMultiplier = $isPeakHour ? 1.3 : 1.0;
        $adjustedDuration = $duration * $trafficMultiplier;

        $estimatedArrival = Carbon::now()
            ->setTime((int) explode(':', $departureTime)[0], (int) explode(':', $departureTime)[1])
            ->addMinutes((int) $adjustedDuration)
            ->format('H:i');

        $fuelCost = $fuelNeeded * 24.5;
        $tollCost = $distance > 100 ? ($distance * 0.5) : 0;
        $totalExtraCost = $fuelCost + $tollCost;

        $suggestedDepartures = $this->getSuggestedDepartures($origin, $destination);

        return [
            'origin' => $origin,
            'destination' => $destination,
            'distance_km' => round($distance, 1),
            'duration_minutes' => round($adjustedDuration, 0),
            'fuel_needed_liters' => round($fuelNeeded, 1),
            'fuel_cost' => round($fuelCost, 2),
            'toll_cost' => round($tollCost, 2),
            'total_extra_cost' => round($totalExtraCost, 2),
            'estimated_arrival' => $estimatedArrival,
            'is_peak_hour' => $isPeakHour,
            'traffic_level' => $isPeakHour ? 'Alto' : 'Normal',
            'suggested_departures' => $suggestedDepartures,
            'recommendations' => $this->getRouteRecommendations($distance, $isPeakHour, $weight),
        ];
    }

    /**
     * Convierte la respuesta del servicio Python de rutas al formato del panel.
     */
    protected function buildRouteResult(array $py, string $origin, string $destination, string $materialType, float $weight, string $departureTime): array
    {
        $distance = (float) ($py['distance_km'] ?? $py['adjusted_distance_km'] ?? 0);
        $durationMin = (float) ($py['estimated_hours'] ?? 0) * 60;
        $fuel = (float) ($py['fuel_estimate_liters'] ?? 0);
        $toll = (float) ($py['toll_estimate'] ?? 0);
        $fuelCost = $fuel * 24.5;
        $totalExtra = $fuelCost + $toll;
        $isPeak = strtolower((string) ($py['traffic_level'] ?? '')) === 'heavy';

        return [
            'origin' => $origin,
            'destination' => $destination,
            'distance_km' => round($distance, 1),
            'duration_minutes' => round($durationMin, 0),
            'fuel_needed_liters' => round($fuel, 1),
            'fuel_cost' => round($fuelCost, 2),
            'toll_cost' => round($toll, 2),
            'total_extra_cost' => round($totalExtra, 2),
            'estimated_arrival' => now()->setTime(
                (int) explode(':', $departureTime)[0],
                (int) explode(':', $departureTime)[1]
            )->addMinutes((int) $durationMin)->format('H:i'),
            'is_peak_hour' => $isPeak,
            'traffic_level' => $isPeak ? 'Alto' : 'Normal',
            'suggested_departures' => $this->getSuggestedDepartures($origin, $destination),
            'recommendations' => $this->getRouteRecommendations($distance, $isPeak, $weight),
            'method' => 'ml',
        ];
    }

    private function estimateDistance(string $origin, string $destination): float
    {
        $distances = [
            'cantera-centro' => 45,
            'cantera-norte' => 62,
            'cantera-sur' => 38,
            'centro-norte' => 25,
            'centro-sur' => 18,
        ];

        $key = strtolower($origin) . '-' . strtolower($destination);
        return $distances[$key] ?? rand(30, 80);
    }

    private function estimateDuration(float $distance): float
    {
        return $distance * 1.2;
    }

    private function estimateFuel(float $distance, float $weight): float
    {
        $baseConsumption = 0.35;
        $weightFactor = $weight > 20 ? 1.2 : 1.0;
        return $distance * $baseConsumption * $weightFactor;
    }

    private function getSuggestedDepartures(string $origin, string $destination): array
    {
        return [
            ['time' => '05:00', 'reason' => 'Sin tráfico, llegada temprana', 'recommended' => true],
            ['time' => '06:00', 'reason' => 'Buen balance hora/tráfico', 'recommended' => true],
            ['time' => '09:30', 'reason' => 'Post-hora pico', 'recommended' => false],
            ['time' => '14:00', 'reason' => 'Sin tráfico, media tarde', 'recommended' => false],
        ];
    }

    private function getRouteRecommendations(float $distance, bool $isPeakHour, float $weight): array
    {
        $recommendations = [];

        if ($isPeakHour) {
            $recommendations[] = 'Evitar hora pico:considerar salida antes de las 07:00 o después de las 09:30';
        }

        if ($distance > 50) {
            $recommendations[] = 'Viaje largo: verificar nivel de combustible y documentación';
        }

        if ($weight > 25) {
            $recommendations[] = 'Carga pesada: verificar presión de llantas y frenos';
        }

        $recommendations[] = 'Verificar ruta alternativa en caso de bloqueo vial';
        $recommendations[] = 'Llevar copia de carta porte y documentación del camión';

        return $recommendations;
    }
}

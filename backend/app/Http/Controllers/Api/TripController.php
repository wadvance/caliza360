<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\Driver;
use App\Models\Truck;
use App\Models\Client;
use App\Models\DailyMetrics;
use App\Models\TripLocation;
use App\Services\FirebaseService;
use App\Services\TripTrackingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TripController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index(Request $request)
    {
        $query = Trip::with('driver', 'truck', 'client');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date')) {
            $query->whereDate('scheduled_date', $request->date);
        }

        if ($request->has('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }

        if ($request->has('truck_id')) {
            $query->where('truck_id', $request->truck_id);
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        $trips = $query->orderBy('scheduled_date', 'desc')->get();

        return response()->json($trips);
    }

    public function store(Request $request)
    {
        $request->validate([
            'driver_id' => 'required|exists:drivers,id',
            'truck_id' => 'required|exists:trucks,id',
            'client_id' => 'required|exists:clients,id',
            'origin_name' => 'required|string|max:255',
            'origin_address' => 'required|string|max:500',
            'origin_lat' => 'nullable|numeric',
            'origin_lng' => 'nullable|numeric',
            'origin_quarry' => 'nullable|string|max:255',
            'destination_name' => 'required|string|max:255',
            'destination_address' => 'required|string|max:500',
            'destination_lat' => 'nullable|numeric',
            'destination_lng' => 'nullable|numeric',
            'destination_client' => 'nullable|string|max:255',
            'material_type' => 'required|string|max:100',
            'weight' => 'required|numeric|min:0',
            'price_per_ton' => 'required|numeric|min:0',
            'scheduled_date' => 'required|date',
            'scheduled_time' => 'required|string|max:5',
        ]);

        // Calculate total amount
        $totalAmount = $request->weight * $request->price_per_ton;

        $trip = Trip::create([
            ...$request->all(),
            'total_amount' => $totalAmount,
            'status' => 'scheduled',
        ]);

        if ($this->firebase->isConfigured()) {
            $this->firebase->createTrip($trip->toArray());
        }

        return response()->json($trip, 201);
    }

    public function show(Trip $trip)
    {
        $trip->load('driver', 'truck', 'client');
        return response()->json($trip);
    }

    public function update(Request $request, Trip $trip)
    {
        $request->validate([
            'driver_id' => 'sometimes|exists:drivers,id',
            'truck_id' => 'sometimes|exists:trucks,id',
            'client_id' => 'sometimes|exists:clients,id',
            'origin_name' => 'sometimes|string|max:255',
            'origin_address' => 'sometimes|string|max:500',
            'origin_lat' => 'nullable|numeric',
            'origin_lng' => 'nullable|numeric',
            'origin_quarry' => 'nullable|string|max:255',
            'destination_name' => 'sometimes|string|max:255',
            'destination_address' => 'sometimes|string|max:500',
            'destination_lat' => 'nullable|numeric',
            'destination_lng' => 'nullable|numeric',
            'destination_client' => 'nullable|string|max:255',
            'material_type' => 'sometimes|string|max:100',
            'weight' => 'sometimes|numeric|min:0',
            'price_per_ton' => 'sometimes|numeric|min:0',
            'scheduled_date' => 'sometimes|date',
            'scheduled_time' => 'sometimes|string|max:5',
            'status' => 'sometimes|in:scheduled,in_transit,delivered,returned,cancelled',
            'departure_time' => 'nullable|date',
            'arrival_time' => 'nullable|date',
            'return_time' => 'nullable|date',
            'start_mileage' => 'nullable|numeric|min:0',
            'end_mileage' => 'nullable|numeric|min:0',
            'distance' => 'nullable|numeric|min:0',
            'fuel_start' => 'nullable|numeric|min:0',
            'fuel_end' => 'nullable|numeric|min:0',
            'fuel_consumed' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'fuel_cost' => 'nullable|numeric|min:0',
            'tolls_cost' => 'nullable|numeric|min:0',
            'maintenance_cost' => 'nullable|numeric|min:0',
            'other_cost' => 'nullable|numeric|min:0',
        ]);

        // Recalculate total if weight or price changed
        if ($request->has('weight') || $request->has('price_per_ton')) {
            $weight = $request->weight ?? $trip->weight;
            $pricePerTon = $request->price_per_ton ?? $trip->price_per_ton;
            $trip->total_amount = $weight * $pricePerTon;
        }

        $trip->update($request->all());

        // Update driver status if trip status changed
        if ($request->has('status')) {
            $this->updateDriverStatus($trip);
        }

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateTrip($trip->id, $trip->toArray());
        }

        // Update daily metrics
        DailyMetrics::updateFromTrips($trip->scheduled_date);

        return response()->json($trip);
    }

    public function destroy(Trip $trip)
    {
        $trip->delete();

        if ($this->firebase->isConfigured()) {
            $this->firebase->deleteTrip($trip->id);
        }

        return response()->json(['message' => 'Viaje eliminado correctamente']);
    }

    public function startTrip(Trip $trip)
    {
        if ($trip->status !== 'scheduled') {
            return response()->json(['message' => 'El viaje no está programado'], 400);
        }

        $trip->update([
            'status' => 'in_transit',
            'departure_time' => now(),
            'start_mileage' => $trip->truck->current_mileage,
        ]);

        // Update driver status
        $trip->driver->update(['status' => 'on_trip']);

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateTrip($trip->id, $trip->toArray());
        }

        return response()->json($trip);
    }

    public function deliverTrip(Trip $trip)
    {
        if ($trip->status !== 'in_transit') {
            return response()->json(['message' => 'El viaje no está en tránsito'], 400);
        }

        $trip->update([
            'status' => 'delivered',
            'arrival_time' => now(),
        ]);

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateTrip($trip->id, $trip->toArray());
        }

        return response()->json($trip);
    }

    /**
     * Subir evidencia de entrega (fotos y firma del cliente) para un viaje.
     *
     * `photos` y `signature` aceptan data-URIs base64 (`data:image/png;base64,...`).
     * Devuelve los nombres/URLs públicos de los archivos guardados.
     */
    public function uploadEvidence(Request $request, Trip $trip)
    {
        $request->validate([
            'photos' => 'nullable|array|max:10',
            'photos.*' => 'string',
            'signature' => 'nullable|string',
            'delivery_proof' => 'nullable|string|max:1000',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'notes' => 'nullable|string|max:1000',
        ]);

        $savedPhotos = $trip->photos ?? [];

        // Guardar fotos base64 al disco público
        if ($request->has('photos')) {
            foreach ($request->input('photos') as $dataUrl) {
                $url = $this->persistBase64File($dataUrl, 'trip-evidence');
                if ($url) {
                    $savedPhotos[] = $url;
                }
            }
        }

        $signature = $request->input('signature')
            ? $this->persistBase64File($request->input('signature'), 'trip-evidence', 'signature')
            : $trip->customer_signature;

        $trip->update([
            'photos' => $savedPhotos,
            'customer_signature' => $signature,
            'delivery_proof' => $request->input('delivery_proof') ?? $request->input('notes'),
            'status' => 'delivered',
            'arrival_time' => now(),
        ]);

        // Actualizar estado del conductor
        $this->updateDriverStatus($trip);

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateTrip($trip->id, $trip->toArray());
        }

        // Actualizar métricas diarias
        DailyMetrics::updateFromTrips($trip->scheduled_date);

        return response()->json($trip);
    }

    /**
     * Guarda una data-URI base64 y devuelve su URL pública (o null si es inválida).
     */
    protected function persistBase64File(string $data, string $folder, ?string $prefix = null)
    {
        $decoded = $this->decodeDataUri($data);
        if (!$decoded) {
            return null;
        }

        [$mime, $bytes] = $decoded;

        $ext = match ($mime) {
            'image/png' => 'png',
            'image/jpeg', 'image/jpg' => 'jpg',
            'image/webp' => 'webp',
            'application/pdf' => 'pdf',
            'image/svg+xml' => 'svg',
            default => 'bin',
        };

        $filename = ($prefix ? $prefix.'_' : '').Str::uuid().'.'.$ext;
        Storage::disk('public')->put('trip-evidence/'.$filename, $bytes);

        return asset('storage/trip-evidence/'.$filename);
    }

    /**
     * Extrae los bytes y el mime de una data-URI base64 (data:mime;base64,xxxx).
     */
    protected function decodeDataUri(string $data): ?array
    {
        if (preg_match('/^data:([\w\/\+\.\-]+);base64,(.*)$/s', $data, $m)) {
            $mime = $m[1];
            $bytes = base64_decode($m[2], true);
            return $bytes === false ? null : [$mime, $bytes];
        }

        // Pura base64 sin cabecera
        $bytes = base64_decode($data, true);
        return $bytes === false ? null : ['image/png', $bytes];
    }

    public function returnTrip(Trip $trip)
    {
        if ($trip->status !== 'delivered') {
            return response()->json(['message' => 'El viaje no ha sido entregado'], 400);
        }

        $trip->update([
            'status' => 'returned',
            'return_time' => now(),
            'end_mileage' => $trip->truck->current_mileage,
        ]);

        // Calculate distance and fuel consumed
        if ($trip->start_mileage && $trip->end_mileage) {
            $trip->distance = $trip->end_mileage - $trip->start_mileage;
        }

        if ($trip->fuel_start && $trip->fuel_end) {
            $trip->fuel_consumed = $trip->fuel_start - $trip->fuel_end;
        }

        // Calculate actual duration
        if ($trip->departure_time && $trip->return_time) {
            $trip->actual_duration = $trip->departure_time->diffInHours($trip->return_time);
        }

        $trip->save();

        // Update truck mileage
        $trip->truck->update(['current_mileage' => $trip->end_mileage]);

        // Update driver status
        $trip->driver->update(['status' => 'active']);

        // Update driver stats
        $trip->driver->total_trips = $trip->driver->trips()->where('status', 'returned')->count();
        $trip->driver->save();

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateTrip($trip->id, $trip->toArray());
        }

        // Update daily metrics
        DailyMetrics::updateFromTrips($trip->scheduled_date);

        return response()->json($trip);
    }

    public function cancelTrip(Trip $trip)
    {
        if (in_array($trip->status, ['delivered', 'returned'])) {
            return response()->json(['message' => 'No se puede cancelar un viaje completado'], 400);
        }

        $trip->update(['status' => 'cancelled']);

        // Update driver status if was on trip
        if ($trip->driver->status === 'on_trip') {
            $trip->driver->update(['status' => 'active']);
        }

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateTrip($trip->id, $trip->toArray());
        }

        return response()->json($trip);
    }

    public function getTripsByDate(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $trips = Trip::with('driver', 'truck', 'client')
            ->whereDate('scheduled_date', $request->date)
            ->get();

        return response()->json($trips);
    }

    public function getTripsByDriver(Request $request, Driver $driver)
    {
        $trips = $driver->trips()->with('truck', 'client')
            ->orderBy('scheduled_date', 'desc')
            ->get();

        return response()->json($trips);
    }

    protected function updateDriverStatus(Trip $trip)
    {
        switch ($trip->status) {
            case 'in_transit':
                $trip->driver->update(['status' => 'on_trip']);
                break;
            case 'returned':
            case 'cancelled':
                $trip->driver->update(['status' => 'active']);
                break;
        }
    }

    /**
     * Registrar una o varias ubicaciones GPS de un viaje en curso (telemetría).
     */
    public function recordLocation(Request $request, Trip $trip)
    {
        $request->validate([
            'latitude' => 'required_without:locations|numeric|between:-90,90',
            'longitude' => 'required_without:locations|numeric|between:-180,180',
            'speed' => 'nullable|numeric|min:0',
            'accuracy' => 'nullable|numeric|min:0',
            'recorded_at' => 'nullable|date',
            'locations' => 'nullable|array|max:50',
            'locations.*.latitude' => 'required|numeric|between:-90,90',
            'locations.*.longitude' => 'required|numeric|between:-180,180',
            'locations.*.speed' => 'nullable|numeric|min:0',
            'locations.*.recorded_at' => 'nullable|date',
        ]);

        $now = now();

        if ($request->has('locations')) {
            $points = collect($request->input('locations'))->map(function ($loc) use ($trip, $now) {
                return [
                    'trip_id' => $trip->id,
                    'latitude' => $loc['latitude'],
                    'longitude' => $loc['longitude'],
                    'speed' => $loc['speed'] ?? null,
                    'recorded_at' => $loc['recorded_at'] ?? $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            })->all();
        } else {
            $points = [[
                'trip_id' => $trip->id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'speed' => $request->speed,
                'accuracy' => $request->accuracy,
                'recorded_at' => $request->recorded_at ?? $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]];
        }

        TripLocation::insert($points);

        return response()->json([
            'message' => 'Ubicación registrada correctamente',
            'count' => count($points),
        ], 201);
    }

    /**
     * Obtener la última ubicación registrada de un viaje.
     */
    public function getLocation(Trip $trip)
    {
        $location = $trip->locations()->latest('recorded_at')->first();

        return response()->json([
            'trip_id' => $trip->id,
            ...($location ? [
                'latitude' => $location->latitude,
                'longitude' => $location->longitude,
                'speed' => $location->speed,
                'accuracy' => $location->accuracy,
                'recorded_at' => $location->recorded_at?->toIso8601String(),
            ] : ['latitude' => null, 'longitude' => null]),
        ]);
    }

    /**
     * Flota en vivo: viajes activos con su última ubicación registrada.
     */
    public function liveVehicle(Request $request)
    {
        $query = Trip::with('driver:id,name,phone', 'truck:id,plate,brand,model')
            ->whereIn('status', ['in_transit', 'scheduled']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $trips = $query->latest('departure_time')->get()->map(function ($trip) {
            $last = $trip->locations()->latest('recorded_at')->first();

            return [
                'id' => $trip->id,
                'status' => $trip->status,
                'origin_name' => $trip->origin_name,
                'destination_name' => $trip->destination_name,
                'material_type' => $trip->material_type,
                'weight' => $trip->weight,
                'driver_name' => $trip->driver?->name,
                'driver_phone' => $trip->driver?->phone,
                'truck_plate' => $trip->truck?->plate,
                'location' => $last ? [
                    'latitude' => $last->latitude,
                    'longitude' => $last->longitude,
                    'speed' => $last->speed,
                    'accuracy' => $last->accuracy,
                    'recorded_at' => $last->recorded_at?->toIso8601String(),
                ] : null,
                'last_update' => $last?->recorded_at?->diffForHumans(),
            ];
        });

        return response()->json($trips);
    }

    /**
     * Seguimiento del viaje: recorrido, paradas, tiempo estacionado, distancia
     * recorrida y progreso hacia el destino calculados desde la telemetría GPS.
     */
    public function tracking(Trip $trip)
    {
        $points = $trip->locations()
            ->orderBy('recorded_at')
            ->get();

        $context = [
            'id' => $trip->id,
            'type' => 'viaje',
            'status' => $trip->status,
            'origin_lat' => $trip->origin_lat,
            'origin_lng' => $trip->origin_lng,
            'destination_name' => $trip->destination_name,
            'destination_lat' => $trip->destination_lat,
            'destination_lng' => $trip->destination_lng,
        ];

        return response()->json(app(TripTrackingService::class)->build($context, $points));
    }

    /**
     * Registrar pesaje digital de entrada (bruto) en la báscula.
     */
    public function recordGross(Request $request, Trip $trip)
    {
        $request->validate([
            'gross_weight' => 'required|numeric|min:0',
            'weighted_at' => 'nullable|date',
        ]);

        $trip->update([
            'gross_weight' => $request->gross_weight,
            'weighed_at' => $request->weighted_at ?? now(),
        ]);

        return response()->json($trip);
    }

    /**
     * Registrar pesaje de salida (tara) y calcular el peso neto en báscula.
     */
    public function recordTare(Request $request, Trip $trip)
    {
        $request->validate([
            'tare_weight' => 'required|numeric|min:0',
        ]);

        $net = null;
        if ($trip->gross_weight !== null) {
            $net = max(0, $trip->gross_weight - $request->tare_weight);
        }

        $trip->update([
            'tare_weight' => $request->tare_weight,
            'net_weight' => $net,
            'weighed_at' => now(),
        ]);

        return response()->json($trip);
    }

    /**
     * Registrar control de calidad del material en el viaje.
     */
    public function recordQuality(Request $request, Trip $trip)
    {
        $request->validate([
            'quality_status' => 'required|in:pending,approved,rejected',
            'quality_notes' => 'nullable|string|max:2000',
            'quality_inspector' => 'nullable|string|max:255',
            'batch_code' => 'nullable|string|max:100',
        ]);

        $trip->update([
            'quality_status' => $request->quality_status,
            'quality_notes' => $request->quality_notes,
            'quality_inspector' => $request->quality_inspector,
            'batch_code' => $request->batch_code,
            'quality_checked_at' => now(),
        ]);

        return response()->json($trip);
    }

    /**
     * Geo-cercas: clasifica dónde se encuentra cada unidad activa respecto a su
     * cantera (origen) y destino usando la última ubicación GPS + radio de tolerancia.
     */
    public function liveGeoFences(Request $request)
    {
        $radiusKm = (float) ($request->query('radius_km', config('fleet.geofence_radius_km', 2)) ?: 2);

        $trips = Trip::with('driver:id,name,phone', 'truck:id,plate,brand,model')
            ->whereIn('status', ['in_transit'])
            ->get()
            ->map(function ($trip) use ($radiusKm) {
                $last = $trip->locations()->latest('recorded_at')->first();
                $zone = 'unknown';

                if ($last) {
                    $distOrigin = $this->haversine(
                        $last->latitude, $last->longitude,
                        $trip->origin_lat, $trip->origin_lng
                    );
                    $distDestination = $this->haversine(
                        $last->latitude, $last->longitude,
                        $trip->destination_lat, $trip->destination_lng
                    );

                    $zone = $distOrigin !== null && $distOrigin <= $radiusKm
                        ? 'in_quarry'
                        : ($distDestination !== null && $distDestination <= $radiusKm
                            ? 'at_destination'
                            : 'on_route');
                }

                return [
                    'id' => $trip->id,
                    'status' => $trip->status,
                    'zone' => $zone,
                    'truck_plate' => $trip->truck?->plate,
                    'driver_name' => $trip->driver?->name,
                    'material_type' => $trip->material_type,
                    'weight' => $trip->weight,
                    'origin_name' => $trip->origin_name,
                    'destination_name' => $trip->destination_name,
                    'location' => $last ? [
                        'latitude' => $last->latitude,
                        'longitude' => $last->longitude,
                        'speed' => $last->speed,
                        'accuracy' => $last->accuracy,
                        'recorded_at' => $last->recorded_at?->toIso8601String(),
                    ] : null,
                    'radius_km' => $radiusKm,
                    'last_update' => $last?->recorded_at?->diffForHumans(),
                ];
            });

        return response()->json([
            'radius_km' => $radiusKm,
            'zones' => [
                'in_quarry' => $trips->where('zone', 'in_quarry')->values()->count(),
                'on_route' => $trips->where('zone', 'on_route')->values()->count(),
                'at_destination' => $trips->where('zone', 'at_destination')->values()->count(),
            ],
            'trips' => $trips->values(),
        ]);
    }

    /**
     * Distancia en kilómetros entre dos coordenadas (fórmula de haversine).
     */
    protected function haversine(?float $lat1, ?float $lon1, ?float $lat2, ?float $lon2): ?float
    {
        if ($lat1 === null || $lon1 === null || $lat2 === null || $lon2 === null) {
            return null;
        }

        $earthRadius = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return 2 * $earthRadius * asin(sqrt($a));
    }
}

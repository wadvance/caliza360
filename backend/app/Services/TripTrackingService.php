<?php

namespace App\Services;

use Illuminate\Support\Carbon;

/**
 * Analiza la telemetría GPS de un viaje: recorrido, paradas, tiempo
 * estacionado, distancia recorrida y progreso hacia el destino.
 */
class TripTrackingService
{
    /**
     * Velocidad (km/h) por debajo de la cual se considera que el vehículo está detenido.
     */
    public const STOP_SPEED_KMH = 5.0;

    /**
     * Duración mínima (segundos) para considerar una detención como "parada".
     */
    public const MIN_STOP_SECONDS = 180;

    /**
     * Distancia máxima (km) entre puntos consecutivos sin movimiento para
     * seguir considerando la posición como detenida cuando no hay velocidad.
     */
    public const STOP_DRIFT_KM = 0.06;

    public function __construct(
        private float $stopSpeedKmh = self::STOP_SPEED_KMH,
        private int $minStopSeconds = self::MIN_STOP_SECONDS,
        private float $stopDriftKm = self::STOP_DRIFT_KM,
    ) {}

    /**
     * Genera el resumen de seguimiento de un viaje o proforma a partir de sus
     * puntos GPS.
     *
     * @param  array  $context  Metadatos del desplazamiento: id, type
     *                          (viaje|cantera), status, origin_lat, origin_lng,
     *                          destination_name, destination_lat, destination_lng.
     * @param  array  $points  Colección de puntos GPS ordenada por recorded_at.
     */
    public function build(array $context, $points): array
    {
        $points = collect($points)
            ->sortBy(fn ($p) => $p->recorded_at?->timestamp ?? 0)
            ->values();

        $route = $points->map(fn ($p) => [
            'latitude' => round((float) $p->latitude, 6),
            'longitude' => round((float) $p->longitude, 6),
            'speed' => $p->speed !== null ? round((float) $p->speed, 2) : null,
            'recorded_at' => $p->recorded_at?->toIso8601String(),
        ])->all();

        $segments = $this->segments($points);

        $distance = 0.0;
        foreach ($segments as $seg) {
            $distance += $seg['distance_km'];
        }

        $stops = $this->detectStops($segments);
        $stationarySeconds = array_sum(array_column($stops, 'duration_seconds'));

        $movingSeconds = 0;
        foreach ($segments as $seg) {
            if (!$seg['stopped'] && $seg['seconds'] !== null) {
                $movingSeconds += $seg['seconds'];
            }
        }

        $last = $points->last();
        $lastLocation = $last ? [
            'latitude' => round((float) $last->latitude, 6),
            'longitude' => round((float) $last->longitude, 6),
            'speed' => $last->speed !== null ? round((float) $last->speed, 2) : null,
            'recorded_at' => $last->recorded_at?->toIso8601String(),
        ] : null;

        $progress = $this->progress($context, $lastLocation);

        return [
            'entity_id' => $context['id'],
            'type' => $context['type'],
            'status' => $context['status'],
            'route' => $route,
            'stops' => $stops,
            'last_location' => $lastLocation,
            'stats' => [
                'distance_traveled_km' => round($distance, 2),
                'stationary_time_seconds' => $stationarySeconds,
                'moving_time_seconds' => $movingSeconds,
                'stops_count' => count($stops),
            ],
            'destination' => [
                'name' => $context['destination_name'] ?? null,
                'latitude' => $context['destination_lat'] ?? null,
                'longitude' => $context['destination_lng'] ?? null,
            ],
            'progress' => $progress,
        ];
    }

    /**
     * Construye los segmentos entre puntos consecutivos con su distancia,
     * duración y si el vehículo estaba detenido.
     */
    protected function segments($points): array
    {
        $segments = [];
        $count = $points->count();

        for ($i = 1; $i < $count; $i++) {
            $a = $points[$i - 1];
            $b = $points[$i];

            $distance = $this->haversine(
                $a->latitude, $a->longitude,
                $b->latitude, $b->longitude
            );

            $seconds = null;
            if ($a->recorded_at && $b->recorded_at) {
                $seconds = max(0, $b->recorded_at->timestamp - $a->recorded_at->timestamp);
            }

            $stopped = $this->isStopped($b, $distance);

            $segments[] = [
                'distance_km' => $distance,
                'seconds' => $seconds,
                'stopped' => $stopped,
                'from' => $a,
                'to' => $b,
            ];
        }

        return $segments;
    }

    protected function isStopped($point, float $distanceKm): bool
    {
        if ($point->speed !== null) {
            return (float) $point->speed < $this->stopSpeedKmh;
        }

        return $distanceKm <= $this->stopDriftKm;
    }

    /**
     * Agrupa segmentos consecutivos detenidos en paradas con duración mínima.
     */
    protected function detectStops(array $segments): array
    {
        $stops = [];
        $group = [];

        $flush = function () use (&$group, &$stops) {
            if (count($group) < 2) {
                $group = [];
                return;
            }

            $first = $group[0]['from'];
            $last = $group[count($group) - 1]['to'];

            $duration = null;
            if ($first->recorded_at && $last->recorded_at) {
                $duration = max(0, $last->recorded_at->timestamp - $first->recorded_at->timestamp);
            }

            $duration = $duration ?? 0;
            if ($duration >= $this->minStopSeconds) {
                $stops[] = [
                    'latitude' => round((float) $last->latitude, 6),
                    'longitude' => round((float) $last->longitude, 6),
                    'arrival_at' => $first->recorded_at?->toIso8601String(),
                    'departure_at' => $last->recorded_at?->toIso8601String(),
                    'duration_seconds' => $duration,
                ];
            }

            $group = [];
        };

        foreach ($segments as $seg) {
            if ($seg['stopped']) {
                $group[] = $seg;
            } else {
                $flush();
            }
        }
        $flush();

        return $stops;
    }

    /**
     * Progreso (0-100) y distancia restante hasta el destino basados en la
     * distancia en línea recta desde el origen hasta la última posición.
     */
    protected function progress(array $context, ?array $lastLocation): array
    {
        $originLat = $context['origin_lat'] ?? null;
        $originLng = $context['origin_lng'] ?? null;
        $destLat = $context['destination_lat'] ?? null;
        $destLng = $context['destination_lng'] ?? null;

        if ($lastLocation === null || $destLat === null || $destLng === null) {
            return ['percent' => 0, 'remaining_distance_km' => null];
        }

        $total = $this->haversine($originLat, $originLng, $destLat, $destLng);
        if ($total <= 0) {
            return ['percent' => 100, 'remaining_distance_km' => 0.0];
        }

        $done = $this->haversine($originLat, $originLng, $lastLocation['latitude'], $lastLocation['longitude']);
        $remaining = $this->haversine($lastLocation['latitude'], $lastLocation['longitude'], $destLat, $destLng);

        $percent = max(0, min(100, round(($done / $total) * 100, 1)));

        return [
            'percent' => $percent,
            'remaining_distance_km' => round($remaining, 2),
        ];
    }

    protected function haversine(?float $lat1, ?float $lon1, ?float $lat2, ?float $lon2): float
    {
        if ($lat1 === null || $lon1 === null || $lat2 === null || $lon2 === null) {
            return 0.0;
        }

        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return 2 * $earthRadius * asin(sqrt($a));
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\LoadProforma;
use Illuminate\Http\Request;

/**
 * Flota en vivo unificada: fusiona los viajes de entrega (producción → destino)
 * con las proformas de carga (cantera) para el mapa de control.
 */
class FleetController extends Controller
{
    /**
     * Feed en vivo de todas las unidades activas (viajes + cantera) con su zona
     * geocercada respecto a origen y destino.
     */
    public function live(Request $request)
    {
        $radiusKm = (float) ($request->query('radius_km', config('fleet.geofence_radius_km', 2)) ?: 2);

        $trips = Trip::with('driver:id,name,phone', 'truck:id,name,plate')
            ->whereIn('status', ['scheduled', 'in_transit'])
            ->get();

        $proformas = LoadProforma::with('driver:id,name,phone', 'truck:id,name,plate')
            ->whereIn('status', ['created', 'loaded', 'in_transit'])
            ->get();

        $units = collect();

        foreach ($trips as $trip) {
            $last = $trip->locations()->latest('recorded_at')->first();

            $units->push($this->unit([
                'type' => 'viaje',
                'id' => $trip->id,
                'status' => $trip->status,
                'origin_name' => $trip->origin_name,
                'destination_name' => $trip->destination_name,
                'material_type' => $trip->material_type,
                'weight' => $trip->weight,
                'driver_name' => $trip->driver?->name,
                'driver_phone' => $trip->driver?->phone,
                'truck_plate' => $trip->truck?->plate,
                'origin_lat' => $trip->origin_lat,
                'origin_lng' => $trip->origin_lng,
                'destination_lat' => $trip->destination_lat,
                'destination_lng' => $trip->destination_lng,
                'location' => $last,
            ], $radiusKm));
        }

        foreach ($proformas as $proforma) {
            $last = $proforma->locations()->latest('recorded_at')->first();

            $units->push($this->unit([
                'type' => 'cantera',
                'id' => $proforma->id,
                'status' => $proforma->status,
                'origin_name' => $proforma->origin_name ?? $proforma->origin_quarry ?? 'Cantera',
                'destination_name' => $proforma->destination_name,
                'material_type' => $proforma->material_type,
                'weight' => $proforma->weight_tons,
                'driver_name' => $proforma->driver?->name,
                'driver_phone' => $proforma->driver?->phone,
                'truck_plate' => $proforma->truck?->plate,
                'origin_lat' => $proforma->origin_lat,
                'origin_lng' => $proforma->origin_lng,
                'destination_lat' => $proforma->destination_lat,
                'destination_lng' => $proforma->destination_lng,
                'location' => $last,
            ], $radiusKm));
        }

        $units = $units->sortByDesc(fn ($u) => $u['last_update'] ?? '')->values();

        return response()->json([
            'radius_km' => $radiusKm,
            'zones' => [
                'in_quarry' => $units->where('zone', 'in_quarry')->count(),
                'on_route' => $units->where('zone', 'on_route')->count(),
                'at_destination' => $units->where('zone', 'at_destination')->count(),
                'unknown' => $units->where('zone', 'unknown')->count(),
            ],
            'units' => $units,
        ]);
    }

    protected function unit(array $t, float $radiusKm): array
    {
        $last = $t['location'];
        $zone = 'unknown';

        if ($last) {
            $distOrigin = $this->haversine(
                $last->latitude, $last->longitude,
                $t['origin_lat'], $t['origin_lng']
            );
            $distDestination = $this->haversine(
                $last->latitude, $last->longitude,
                $t['destination_lat'], $t['destination_lng']
            );

            if ($distOrigin === null && $distDestination === null) {
                $zone = 'unknown';
            } elseif ($distOrigin !== null && $distOrigin <= $radiusKm) {
                $zone = 'in_quarry';
            } elseif ($distDestination !== null && $distDestination <= $radiusKm) {
                $zone = 'at_destination';
            } else {
                $zone = 'on_route';
            }
        }

        return [
            'type' => $t['type'],
            'id' => $t['id'],
            'status' => $t['status'],
            'zone' => $zone,
            'truck_plate' => $t['truck_plate'],
            'driver_name' => $t['driver_name'],
            'driver_phone' => $t['driver_phone'],
            'origin_name' => $t['origin_name'],
            'destination_name' => $t['destination_name'],
            'material_type' => $t['material_type'],
            'weight' => $t['weight'],
            'location' => $last ? [
                'latitude' => $last->latitude,
                'longitude' => $last->longitude,
                'speed' => $last->speed,
                'accuracy' => $last->accuracy,
                'recorded_at' => $last->recorded_at?->toIso8601String(),
            ] : null,
            'last_update' => $last?->recorded_at?->diffForHumans(),
        ];
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

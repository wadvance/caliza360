<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoadProforma;
use App\Models\LoadProformaLocation;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Client;
use App\Services\TripTrackingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class LoadProformaController extends Controller
{
    /**
     * Listar proformas de carga (filtrable por fecha).
     */
    public function index(Request $request)
    {
        $query = LoadProforma::with(['truck:id,plate', 'driver:id,name', 'client:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('id');

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('destination_name')) {
            $query->where('destination_name', 'LIKE', '%' . $request->destination_name . '%');
        }

        return response()->json($query->get());
    }

    /**
     * Crear proforma de carga (la ingresa el Supervisor).
     */
    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $data['proforma_number'] = $this->generateNumber($data['date']);
        $data['created_by'] = $request->user()->id;

        $proforma = LoadProforma::create($data);

        return response()->json($proforma->load([
            'truck:id,plate',
            'driver:id,name',
            'client:id,name',
        ]), 201);
    }

    public function show(LoadProforma $proforma)
    {
        return response()->json($proforma->load([
            'truck:id,plate',
            'driver:id,name',
            'client:id,name',
            'createdBy:id,name',
        ]));
    }

    public function update(Request $request, LoadProforma $proforma)
    {
        $data = $this->validateData($request);

        $proforma->update($data);

        return response()->json($proforma->load([
            'truck:id,plate',
            'driver:id,name',
            'client:id,name',
        ]));
    }

    public function destroy(LoadProforma $proforma)
    {
        $proforma->delete();

        return response()->json(['message' => 'Proforma eliminada correctamente']);
    }

    /**
     * Resumen diario: cuántos sacos salen, cuánta carga,
     * desglose por destino (puntos de Panamá) y por camionero.
     */
    public function summary(Request $request)
    {
        $date = $request->date ?? now()->toDateString();

        $proformas = LoadProforma::whereDate('date', $date)->get();

        $byDestination = LoadProforma::whereDate('date', $date)
            ->select('destination_name', 'client_id')
            ->selectRaw('SUM(weight_tons) as total_tons')
            ->selectRaw('SUM(sack_count) as total_sacks')
            ->selectRaw('COUNT(*) as total_loads')
            ->groupBy('destination_name', 'client_id')
            ->get()
            ->map(function ($row) {
                $row->client = $row->client_id
                    ? Client::find($row->client_id)?->only('id', 'name')
                    : null;

                return $row;
            });

        $byDriver = LoadProforma::whereDate('date', $date)
            ->select('driver_id')
            ->selectRaw('SUM(weight_tons) as total_tons')
            ->selectRaw('SUM(sack_count) as total_sacks')
            ->selectRaw('COUNT(*) as total_loads')
            ->groupBy('driver_id')
            ->get()
            ->map(function ($row) {
                $row->driver = Driver::find($row->driver_id)?->only('id', 'name');

                return $row;
            });

        return response()->json([
            'date' => $date,
            'total_loads' => $proformas->count(),
            'total_sacks' => $proformas->sum('sack_count'),
            'total_tons' => round($proformas->sum('weight_tons'), 2),
            'by_destination' => $byDestination,
            'by_driver' => $byDriver,
        ]);
    }

    /**
     * Registrar una o varias ubicaciones GPS de una proforma en curso.
     */
    public function recordLocation(Request $request, LoadProforma $proforma)
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
            $points = collect($request->input('locations'))->map(function ($loc) use ($proforma, $now) {
                return [
                    'load_proforma_id' => $proforma->id,
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
                'load_proforma_id' => $proforma->id,
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
                'speed' => $request->speed,
                'accuracy' => $request->accuracy,
                'recorded_at' => $request->recorded_at ?? $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]];
        }

        LoadProformaLocation::insert($points);

        return response()->json([
            'message' => 'Ubicación registrada correctamente',
            'count' => count($points),
        ], 201);
    }

    /**
     * Obtener la última ubicación registrada de una proforma.
     */
    public function getLocation(LoadProforma $proforma)
    {
        $location = $proforma->locations()->latest('recorded_at')->first();

        return response()->json([
            'proforma_id' => $proforma->id,
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
     * Seguimiento de una proforma (recorrido a la cantera): recorrido, paradas,
     * tiempo estacionado, distancia recorrida y progreso hacia el destino.
     */
    public function tracking(LoadProforma $proforma)
    {
        $points = $proforma->locations()
            ->orderBy('recorded_at')
            ->get();

        $context = [
            'id' => $proforma->id,
            'type' => 'cantera',
            'status' => $proforma->status,
            'origin_lat' => $proforma->origin_lat,
            'origin_lng' => $proforma->origin_lng,
            'destination_name' => $proforma->destination_name,
            'destination_lat' => $proforma->destination_lat,
            'destination_lng' => $proforma->destination_lng,
        ];

        return response()->json(app(TripTrackingService::class)->build($context, $points));
    }

    /**
     * Flota de cantera: proformas activas con su última ubicación registrada.
     */
    public function live(Request $request)
    {
        $query = LoadProforma::with('driver:id,name,phone', 'truck:id,plate,brand,model')
            ->whereIn('status', ['created', 'loaded', 'in_transit']);

        $proformas = $query->latest('date')->get()->map(function ($p) {
            $last = $p->locations()->latest('recorded_at')->first();

            return [
                'id' => $p->id,
                'status' => $p->status,
                'origin_name' => $p->origin_name ?? $p->origin_quarry ?? 'Cantera',
                'destination_name' => $p->destination_name,
                'material_type' => $p->material_type,
                'weight' => $p->weight_tons,
                'driver_name' => $p->driver?->name,
                'driver_phone' => $p->driver?->phone,
                'truck_plate' => $p->truck?->plate,
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

        return response()->json($proformas);
    }

    protected function validateData(Request $request): array
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'truck_id' => 'required|exists:trucks,id',
            'driver_id' => 'required|exists:drivers,id',
            'client_id' => 'nullable|exists:clients,id',
            'origin_quarry' => 'nullable|string|max:255',
            'destination_name' => 'required|string|max:255',
            'material_type' => 'required|string|max:100',
            'weight_tons' => 'required|numeric|min:0',
            'sack_count' => 'nullable|integer|min:0',
            'gross_weight' => 'nullable|numeric|min:0',
            'tare_weight' => 'nullable|numeric|min:0',
            'net_weight' => 'nullable|numeric|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:created,loaded,in_transit,delivered',
            'notes' => 'nullable|string',
        ]);

        $validated['sack_count'] = $validated['sack_count'] ?? 0;

        return $validated;
    }

    protected function generateNumber(string $date): string
    {
        $count = LoadProforma::whereDate('date', $date)->count() + 1;

        return 'PF-' . str_replace('-', '', $date) . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}

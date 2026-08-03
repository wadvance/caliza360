<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dispatch;
use App\Models\Client;
use Illuminate\Http\Request;

class DispatchController extends Controller
{
    /**
     * Despachos de producción (mercancía que sale de la planta).
     */
    public function index(Request $request)
    {
        $query = Dispatch::with(['truck:id,plate', 'driver:id,name', 'client:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('id');

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('destination_name')) {
            $query->where('destination_name', 'LIKE', '%' . $request->destination_name . '%');
        }

        return response()->json($query->get()->map(function (Dispatch $dispatch) {
            $dispatch->performance_percent = $dispatch->getPerformancePercent();

            return $dispatch;
        }));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $data['dispatch_number'] = $this->generateNumber($data['date']);
        $data['created_by'] = $request->user()->id;

        $dispatch = Dispatch::create($data);

        return response()->json($dispatch->load([
            'truck:id,plate',
            'driver:id,name',
            'client:id,name',
        ]), 201);
    }

    public function show(Dispatch $dispatch)
    {
        return response()->json($dispatch->load([
            'truck:id,plate',
            'driver:id,name',
            'client:id,name',
            'createdBy:id,name',
        ]));
    }

    public function update(Request $request, Dispatch $dispatch)
    {
        $data = $this->validateData($request);

        $dispatch->update($data);

        return response()->json($dispatch->load([
            'truck:id,plate',
            'driver:id,name',
            'client:id,name',
        ]));
    }

    public function destroy(Dispatch $dispatch)
    {
        $dispatch->delete();

        return response()->json(['message' => 'Despacho eliminado correctamente']);
    }

    /**
     * Resumen de despachos: rendimiento promedio, toneladas plan vs real,
     * sacos y desglose por destino.
     */
    public function summary(Request $request)
    {
        $date = $request->date ?? now()->toDateString();

        $dispatches = Dispatch::whereDate('date', $date)->get();

        $planned = $dispatches->sum('planned_tons');
        $actual = $dispatches->sum('actual_tons');

        $byDestination = Dispatch::whereDate('date', $date)
            ->select('destination_name', 'client_id')
            ->selectRaw('SUM(planned_tons) as planned_tons')
            ->selectRaw('SUM(actual_tons) as actual_tons')
            ->selectRaw('SUM(sack_count) as total_sacks')
            ->selectRaw('COUNT(*) as total_deliveries')
            ->groupBy('destination_name', 'client_id')
            ->get()
            ->map(function ($row) {
                $row->client = $row->client_id
                    ? Client::find($row->client_id)?->only('id', 'name')
                    : null;
                $row->performance_percent = $row->planned_tons > 0
                    ? round(($row->actual_tons / $row->planned_tons) * 100, 1)
                    : 0;

                return $row;
            });

        return response()->json([
            'date' => $date,
            'total_deliveries' => $dispatches->count(),
            'planned_tons' => round($planned, 2),
            'actual_tons' => round($actual, 2),
            'total_sacks' => $dispatches->sum('sack_count'),
            'performance_percent' => $planned > 0 ? round(($actual / $planned) * 100, 1) : 0,
            'by_destination' => $byDestination,
        ]);
    }

    protected function validateData(Request $request): array
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'truck_id' => 'required|exists:trucks,id',
            'driver_id' => 'required|exists:drivers,id',
            'client_id' => 'nullable|exists:clients,id',
            'destination_name' => 'required|string|max:255',
            'material_type' => 'required|string|max:100',
            'planned_tons' => 'required|numeric|min:0',
            'actual_tons' => 'required|numeric|min:0',
            'sack_count' => 'nullable|integer|min:0',
            'departure_datetime' => 'nullable|date',
            'delivery_datetime' => 'nullable|date',
            'status' => 'sometimes|in:scheduled,in_transit,delivered,cancelled',
            'responsible_person' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $validated['sack_count'] = $validated['sack_count'] ?? 0;

        return $validated;
    }

    protected function generateNumber(string $date): string
    {
        $count = Dispatch::whereDate('date', $date)->count() + 1;

        return 'DS-' . str_replace('-', '', $date) . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}

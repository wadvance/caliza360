<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Control;
use Illuminate\Http\Request;

class ControlController extends Controller
{
    /**
     * Controles de entrada/salida y pesaje en cantera y planta.
     */
    public function index(Request $request)
    {
        $query = Control::with(['truck:id,plate', 'driver:id,name', 'proforma:id,proforma_number', 'dispatch:id,dispatch_number'])
            ->orderByDesc('date')
            ->orderByDesc('id');

        if ($request->filled('location')) {
            $query->where('location', $request->location);
        }

        if ($request->filled('control_type')) {
            $query->where('control_type', $request->control_type);
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $data['control_number'] = $this->generateNumber($data['date']);
        $data['created_by'] = $request->user()->id;

        $control = Control::create($data);

        return response()->json($control->load([
            'truck:id,plate',
            'driver:id,name',
            'proforma:id,proforma_number',
            'dispatch:id,dispatch_number',
        ]), 201);
    }

    public function show(Control $control)
    {
        return response()->json($control->load([
            'truck:id,plate',
            'driver:id,name',
            'proforma:id,proforma_number',
            'dispatch:id,dispatch_number',
            'createdBy:id,name',
        ]));
    }

    public function update(Request $request, Control $control)
    {
        $data = $this->validateData($request);

        $control->update($data);

        return response()->json($control->load([
            'truck:id,plate',
            'driver:id,name',
            'proforma:id,proforma_number',
            'dispatch:id,dispatch_number',
        ]));
    }

    public function destroy(Control $control)
    {
        $control->delete();

        return response()->json(['message' => 'Control eliminado correctamente']);
    }

    /**
     * Resumen de controles por ubicación y tipo.
     */
    public function summary(Request $request)
    {
        $date = $request->date ?? now()->toDateString();

        $controls = Control::whereDate('date', $date)->get();

        $byLocation = Control::whereDate('date', $date)
            ->select('location', 'control_type')
            ->selectRaw('COUNT(*) as total_controls')
            ->selectRaw('SUM(weight_tons) as total_tons')
            ->selectRaw('SUM(sack_count) as total_sacks')
            ->groupBy('location', 'control_type')
            ->get();

        return response()->json([
            'date' => $date,
            'total_controls' => $controls->count(),
            'total_tons' => round($controls->sum('weight_tons'), 2),
            'total_sacks' => $controls->sum('sack_count'),
            'by_location' => $byLocation,
        ]);
    }

    protected function validateData(Request $request): array
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'location' => 'required|in:cantera,planta',
            'control_type' => 'required|in:entrada,salida',
            'truck_id' => 'required|exists:trucks,id',
            'driver_id' => 'required|exists:drivers,id',
            'proforma_id' => 'nullable|exists:load_proformas,id',
            'dispatch_id' => 'nullable|exists:dispatches,id',
            'weight_tons' => 'required|numeric|min:0',
            'sack_count' => 'nullable|integer|min:0',
            'responsible_person' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $validated['sack_count'] = $validated['sack_count'] ?? 0;

        return $validated;
    }

    protected function generateNumber(string $date): string
    {
        $day = substr($date, 0, 10);
        $count = Control::whereDate('date', $day)->count() + 1;

        return 'CT-' . str_replace('-', '', $day) . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
    }
}

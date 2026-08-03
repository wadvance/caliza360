<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PettyCash;
use Illuminate\Http\Request;

class PettyCashController extends Controller
{
    /**
     * Control de caja menuda: entradas y salidas con saldo.
     */
    public function index(Request $request)
    {
        $query = PettyCash::with(['creator:id,name'])
            ->orderByDesc('date')
            ->orderByDesc('id');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $data['created_by'] = $request->user()->id;

        $cash = PettyCash::create($data);

        return response()->json($cash->load(['creator:id,name']), 201);
    }

    public function show(PettyCash $cash)
    {
        return response()->json($cash->load(['creator:id,name']));
    }

    public function update(Request $request, PettyCash $cash)
    {
        $data = $this->validateData($request);

        $cash->update($data);

        return response()->json($cash->load(['creator:id,name']));
    }

    public function destroy(PettyCash $cash)
    {
        $cash->delete();

        return response()->json(['message' => 'Movimiento de caja eliminado correctamente']);
    }

    /**
     * Resumen de caja menuda: saldo = entradas - salidas.
     */
    public function summary(Request $request)
    {
        $query = PettyCash::query();

        if ($request->filled('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        $entradas = (clone $query)->where('type', PettyCash::TYPE_ENTRADA)->sum('amount');
        $salidas = (clone $query)->where('type', PettyCash::TYPE_SALIDA)->sum('amount');

        $byCategory = (clone $query)
            ->select('category')
            ->selectRaw('SUM(CASE WHEN type = "salida" THEN amount ELSE 0 END) as total_salidas')
            ->selectRaw('SUM(CASE WHEN type = "entrada" THEN amount ELSE 0 END) as total_entradas')
            ->groupBy('category')
            ->get();

        return response()->json([
            'balance' => round($entradas - $salidas, 2),
            'total_entradas' => round($entradas, 2),
            'total_salidas' => round($salidas, 2),
            'total_movements' => $query->count(),
            'by_category' => $byCategory,
        ]);
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'date' => 'required|date',
            'concept' => 'required|string|max:255',
            'type' => 'required|in:' . implode(',', PettyCash::TYPES),
            'amount' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'responsible_person' => 'nullable|string|max:255',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);
    }
}

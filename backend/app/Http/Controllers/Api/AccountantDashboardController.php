<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountantCost;
use App\Models\AccountantAsset;
use App\Models\AccountantBudget;
use App\Models\AccountantCompliance;
use Illuminate\Http\Request;

class AccountantDashboardController extends Controller
{
    /**
     * Espacio de trabajo del contador de costos.
     * Incluye: control de costos de producción, gestión de inventarios y activos
     * (depreciación), análisis de rentabilidad (presupuestos CAPEX/OPEX) y
     * cumplimiento tributario y ambiental.
     */

    // ============================ COSTOS DE PRODUCCIÓN ============================

    public function costsIndex(Request $request)
    {
        $query = AccountantCost::with('creator:id,name')
            ->orderByDesc('cost_date');

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('date')) {
            $query->whereDate('cost_date', $request->date);
        }

        if ($request->filled('from')) {
            $query->whereDate('cost_date', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('cost_date', '<=', $request->to);
        }

        return response()->json($query->get());
    }

    public function costsStore(Request $request)
    {
        $data = $this->validateCost($request);

        // Costo unitario real por tonelada cuando hay tonelaje registrado
        $tonnage = (float) $data['tonnage'];
        if ($tonnage > 0) {
            $data['unit_cost'] = round((float) $data['amount'] / $tonnage, 2);
        }

        $item = AccountantCost::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function costsUpdate(Request $request, AccountantCost $item)
    {
        $data = $this->validateCost($request);

        $tonnage = (float) $data['tonnage'];
        if ($tonnage > 0) {
            $data['unit_cost'] = round((float) $data['amount'] / $tonnage, 2);
        }

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function costsDestroy(AccountantCost $item)
    {
        $item->delete();

        return response()->json(['message' => 'Registro de costo eliminado correctamente']);
    }

    protected function validateCost(Request $request): array
    {
        return $request->validate([
            'category' => 'sometimes|in:electricidad,combustible,maquinaria,explosivos,personal,mantenimiento,otros',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'tonnage' => 'nullable|numeric|min:0',
            'cost_date' => 'required|date',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', AccountantCost::STATUSES),
        ]);
    }

    // ============================ ACTIVOS Y DEPRECIACIÓN ============================

    public function assetsIndex(Request $request)
    {
        $query = AccountantAsset::with('creator:id,name')
            ->orderByDesc('acquisition_date');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function assetsStore(Request $request)
    {
        $data = $this->validateAsset($request);

        $item = AccountantAsset::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function assetsUpdate(Request $request, AccountantAsset $item)
    {
        $data = $this->validateAsset($request);

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function assetsDestroy(AccountantAsset $item)
    {
        $item->delete();

        return response()->json(['message' => 'Activo eliminado correctamente']);
    }

    protected function validateAsset(Request $request): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'sometimes|in:maquinaria,horno_calero,concesion_minera,vehiculo,instalacion,otro',
            'acquisition_value' => 'required|numeric|min:0',
            'acquisition_date' => 'required|date',
            'useful_life_years' => 'nullable|numeric|min:0',
            'salvage_value' => 'nullable|numeric|min:0',
            'accumulated_depreciation' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', AccountantAsset::STATUSES),
        ]);
    }

    // ============================ PRESUPUESTOS (CAPEX/OPEX) ============================

    public function budgetsIndex(Request $request)
    {
        $query = AccountantBudget::with('creator:id,name')
            ->orderByDesc('created_at');

        if ($request->filled('budget_type')) {
            $query->where('budget_type', $request->budget_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function budgetsStore(Request $request)
    {
        $data = $this->validateBudget($request);

        $item = AccountantBudget::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function budgetsUpdate(Request $request, AccountantBudget $item)
    {
        $data = $this->validateBudget($request);

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function budgetsDestroy(AccountantBudget $item)
    {
        $item->delete();

        return response()->json(['message' => 'Presupuesto eliminado correctamente']);
    }

    protected function validateBudget(Request $request): array
    {
        return $request->validate([
            'title' => 'required|string|max:255',
            'budget_type' => 'sometimes|in:capex,opex',
            'category' => 'sometimes|in:proceso,personal,combustible,energia,mantenimiento,proyecto,otro',
            'planned_amount' => 'required|numeric|min:0',
            'actual_amount' => 'nullable|numeric|min:0',
            'period' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', AccountantBudget::STATUSES),
        ]);
    }

    // ============================ CUMPLIMIENTO TRIBUTARIO Y AMBIENTAL ============================

    public function complianceIndex(Request $request)
    {
        $query = AccountantCompliance::with('creator:id,name')
            ->orderByDesc('due_date');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function complianceStore(Request $request)
    {
        $data = $this->validateCompliance($request);

        $item = AccountantCompliance::create([
            ...$data,
            'created_by' => $request->user()->id,
        ]);

        return response()->json($item->load('creator:id,name'), 201);
    }

    public function complianceUpdate(Request $request, AccountantCompliance $item)
    {
        $data = $this->validateCompliance($request);

        $item->update($data);

        return response()->json($item->load('creator:id,name'));
    }

    public function complianceDestroy(AccountantCompliance $item)
    {
        $item->delete();

        return response()->json(['message' => 'Obligación eliminada correctamente']);
    }

    protected function validateCompliance(Request $request): array
    {
        return $request->validate([
            'type' => 'sometimes|in:' . implode(',', AccountantCompliance::TYPES),
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'nullable|date',
            'paid_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:' . implode(',', AccountantCompliance::STATUSES),
        ]);
    }

    // ============================ RESUMEN ============================

    public function summary()
    {
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        $monthCosts = AccountantCost::whereBetween('cost_date', [$monthStart, $monthEnd])
            ->where('status', '!=', AccountantCost::STATUS_ANULADO)
            ->get();

        $monthTonnage = $monthCosts->sum('tonnage');
        $monthAmount = $monthCosts->sum('amount');

        $annualDepreciation = AccountantAsset::where('status', AccountantAsset::STATUS_ACTIVO)
            ->get()
            ->sum(fn ($asset) => $asset->annualDepreciation());

        $assetsValue = AccountantAsset::where('status', AccountantAsset::STATUS_ACTIVO)->sum('acquisition_value');
        $accumDepreciation = AccountantAsset::where('status', AccountantAsset::STATUS_ACTIVO)->sum('accumulated_depreciation');

        $budgets = AccountantBudget::whereIn('status', [AccountantBudget::STATUS_APROBADO, AccountantBudget::STATUS_EJECUTADO])->get();

        return response()->json([
            'costs' => [
                'month_amount' => round($monthAmount, 2),
                'month_tonnage' => round((float) $monthTonnage, 2),
                'unit_cost_per_ton' => $monthTonnage > 0 ? round($monthAmount / $monthTonnage, 2) : 0,
                'electricity' => $monthCosts->where('category', 'electricidad')->sum('amount'),
                'fuel' => $monthCosts->where('category', 'combustible')->sum('amount'),
                'machinery' => $monthCosts->where('category', 'maquinaria')->sum('amount'),
                'explosives' => $monthCosts->where('category', 'explosivos')->sum('amount'),
                'labor' => $monthCosts->where('category', 'personal')->sum('amount'),
            ],
            'assets' => [
                'active' => AccountantAsset::where('status', AccountantAsset::STATUS_ACTIVO)->count(),
                'total_value' => round($assetsValue, 2),
                'accumulated_depreciation' => round($accumDepreciation, 2),
                'annual_depreciation' => round($annualDepreciation, 2),
            ],
            'budgets' => [
                'capex_planned' => round($budgets->where('budget_type', AccountantBudget::TYPE_CAPEX)->sum('planned_amount'), 2),
                'capex_actual' => round($budgets->where('budget_type', AccountantBudget::TYPE_CAPEX)->sum('actual_amount'), 2),
                'opex_planned' => round($budgets->where('budget_type', AccountantBudget::TYPE_OPEX)->sum('planned_amount'), 2),
                'opex_actual' => round($budgets->where('budget_type', AccountantBudget::TYPE_OPEX)->sum('actual_amount'), 2),
            ],
            'compliance' => [
                'pending' => AccountantCompliance::whereIn('status', [AccountantCompliance::STATUS_PENDIENTE, AccountantCompliance::STATUS_VENCIDO])->count(),
                'overdue' => AccountantCompliance::where('status', AccountantCompliance::STATUS_VENCIDO)->count(),
                'provisions' => AccountantCompliance::where('type', AccountantCompliance::TYPE_PROVISION_CIERRE)
                    ->whereIn('status', [AccountantCompliance::STATUS_PROVISIONADO, AccountantCompliance::STATUS_PENDIENTE])
                    ->sum('amount'),
            ],
        ]);
    }
}

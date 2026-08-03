<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Inventory;
use App\Services\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function tonsByClient(Request $request)
    {
        $startDate = $request->start_date ?? now()->subMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $data = Trip::select('client_id', DB::raw('SUM(weight) as total_tons'), DB::raw('COUNT(*) as total_trips'))
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->groupBy('client_id')
            ->orderByDesc('total_tons')
            ->get()
            ->load('client');

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'data' => $data,
        ]);
    }

    public function tripProfitability(Request $request)
    {
        $startDate = $request->start_date ?? now()->subMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $data = Trip::select(
                'id',
                'scheduled_date',
                'material_type',
                'weight',
                'total_amount',
                DB::raw('fuel_cost + tolls_cost + maintenance_cost + other_cost as total_costs'),
                DB::raw('total_amount - (fuel_cost + tolls_cost + maintenance_cost + other_cost) as profit'),
                DB::raw('(total_amount - (fuel_cost + tolls_cost + maintenance_cost + other_cost)) / total_amount * 100 as profit_margin')
            )
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->orderBy('scheduled_date')
            ->get();

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'data' => $data,
        ]);
    }

    public function fuelConsumption(Request $request)
    {
        $startDate = $request->start_date ?? now()->subMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $data = Trip::select(
                'truck_id',
                DB::raw('SUM(fuel_consumed) as total_fuel'),
                DB::raw('SUM(distance) as total_distance'),
                DB::raw('SUM(fuel_cost) as total_fuel_cost'),
                DB::raw('AVG(fuel_consumed / NULLIF(distance, 0)) as avg_consumption_per_km')
            )
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->groupBy('truck_id')
            ->get()
            ->load('truck');

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'data' => $data,
        ]);
    }

    public function operationCosts(Request $request)
    {
        $startDate = $request->start_date ?? now()->subMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $data = Trip::select(
                DB::raw('SUM(fuel_cost) as fuel'),
                DB::raw('SUM(tolls_cost) as tolls'),
                DB::raw('SUM(maintenance_cost) as maintenance'),
                DB::raw('SUM(other_cost) as other'),
                DB::raw('SUM(fuel_cost + tolls_cost + maintenance_cost + other_cost) as total')
            )
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->first();

        $total = (float) ($data->total ?? 0);

        $categories = collect([
            ['category' => 'Combustible', 'amount' => (float) ($data->fuel ?? 0)],
            ['category' => 'Peajes', 'amount' => (float) ($data->tolls ?? 0)],
            ['category' => 'Mantenimiento', 'amount' => (float) ($data->maintenance ?? 0)],
            ['category' => 'Sueldos', 'amount' => 0],
            ['category' => 'Otros', 'amount' => (float) ($data->other ?? 0)],
        ])
            ->map(fn ($item) => $item + [
                'percentage' => $total > 0 ? round(($item['amount'] / $total) * 100, 1) : 0,
                'trend' => 0,
            ])
            ->filter(fn ($item) => $item['amount'] > 0)
            ->values();

        $monthlyData = Trip::select(
                DB::raw("strftime('%Y-%m', scheduled_date) as month"),
                DB::raw('SUM(fuel_cost + tolls_cost + maintenance_cost + other_cost) as costs')
            )
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->groupBy(DB::raw("strftime('%Y-%m', scheduled_date)"))
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => $row->month,
                'costs' => (float) $row->costs,
            ])
            ->values();

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'total_costs' => $total,
            'categories' => $categories,
            'monthly_data' => $monthlyData,
            'data' => $data,
        ]);
    }

    public function financialSummary(Request $request)
    {
        $startDate = $request->start_date ?? now()->subMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        // Income from trips
        $tripIncome = Trip::whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->sum('total_amount');

        // Costs from trips
        $tripCosts = Trip::whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->sum(DB::raw('fuel_cost + tolls_cost + maintenance_cost + other_cost'));

        // Sales invoices
        $salesInvoices = Invoice::where('type', 'sale')
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->sum('total');

        // Purchase invoices
        $purchaseInvoices = Invoice::where('type', 'purchase')
            ->whereBetween('issue_date', [$startDate, $endDate])
            ->sum('total');

        // Accounts receivable
        $accountsReceivable = Invoice::where('type', 'sale')
            ->where('status', '!=', 'paid')
            ->sum('total');

        // Accounts payable
        $accountsPayable = Invoice::where('type', 'purchase')
            ->where('status', '!=', 'paid')
            ->sum('total');

        // Cost breakdown by category
        $costs = Trip::select(
                DB::raw('SUM(fuel_cost) as fuel'),
                DB::raw('SUM(tolls_cost) as tolls'),
                DB::raw('SUM(maintenance_cost) as maintenance'),
                DB::raw('SUM(other_cost) as other')
            )
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->first();

        $expenseBreakdown = collect([
            ['category' => 'Combustible', 'amount' => (float) ($costs->fuel ?? 0)],
            ['category' => 'Peajes', 'amount' => (float) ($costs->tolls ?? 0)],
            ['category' => 'Mantenimiento', 'amount' => (float) ($costs->maintenance ?? 0)],
            ['category' => 'Otros', 'amount' => (float) ($costs->other ?? 0)],
        ])->filter(fn ($item) => $item['amount'] > 0)->values();

        // Monthly trend
        $monthlyData = Trip::select(
                DB::raw("strftime('%Y-%m', scheduled_date) as month"),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('SUM(fuel_cost + tolls_cost + maintenance_cost + other_cost) as expenses')
            )
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->groupBy(DB::raw("strftime('%Y-%m', scheduled_date)"))
            ->orderBy('month')
            ->get()
            ->map(fn ($row) => [
                'month' => $row->month,
                'revenue' => (float) $row->revenue,
                'expenses' => (float) $row->expenses,
            ])
            ->values();

        $totalRevenue = $tripIncome;
        $totalExpenses = $tripCosts;
        $totalProfit = $totalRevenue - $totalExpenses;
        $profitMargin = $totalRevenue > 0 ? ($totalProfit / $totalRevenue) * 100 : 0;

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'total_revenue' => $totalRevenue,
            'total_expenses' => $totalExpenses,
            'total_profit' => $totalProfit,
            'profit_margin' => $profitMargin,
            'expense_breakdown' => $expenseBreakdown,
            'monthly_data' => $monthlyData,
            'trip_income' => $tripIncome,
            'trip_costs' => $tripCosts,
            'trip_profit' => $tripIncome - $tripCosts,
            'sales_invoices' => $salesInvoices,
            'purchase_invoices' => $purchaseInvoices,
            'accounts_receivable' => $accountsReceivable,
            'accounts_payable' => $accountsPayable,
        ]);
    }

    public function truckPerformance(Request $request)
    {
        $startDate = $request->start_date ?? now()->subMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $data = Trip::select(
                'truck_id',
                DB::raw('COUNT(*) as total_trips'),
                DB::raw('SUM(weight) as total_tons'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('SUM(fuel_cost + tolls_cost + maintenance_cost + other_cost) as total_costs'),
                DB::raw('SUM(distance) as total_distance'),
                DB::raw('AVG(actual_duration) as avg_duration')
            )
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->groupBy('truck_id')
            ->get()
            ->load('truck');

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'data' => $data,
        ]);
    }

    public function driverPerformance(Request $request)
    {
        $startDate = $request->start_date ?? now()->subMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $data = Trip::select(
                'driver_id',
                DB::raw('COUNT(*) as total_trips'),
                DB::raw('SUM(weight) as total_tons'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('SUM(distance) as total_distance'),
                DB::raw('AVG(actual_duration) as avg_duration')
            )
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->groupBy('driver_id')
            ->get()
            ->load('driver');

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'data' => $data,
        ]);
    }

    public function materialReport(Request $request)
    {
        $startDate = $request->start_date ?? now()->subMonth()->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $data = Trip::select(
                'material_type',
                DB::raw('COUNT(*) as total_trips'),
                DB::raw('SUM(weight) as total_tons'),
                DB::raw('SUM(total_amount) as total_revenue'),
                DB::raw('AVG(total_amount / NULLIF(weight, 0)) as avg_price_per_ton')
            )
            ->whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->groupBy('material_type')
            ->get();

        return response()->json([
            'period' => ['start' => $startDate, 'end' => $endDate],
            'data' => $data,
        ]);
    }

    public function inventoryReport()
    {
        $data = Inventory::all();

        $summary = [
            'total_items' => $data->count(),
            'total_stock' => $data->sum('current_stock'),
            'total_value' => $data->sum(function ($item) {
                return $item->current_stock * $item->unit_cost;
            }),
            'low_stock_count' => $data->filter(function ($item) {
                return $item->current_stock <= $item->min_stock;
            })->count(),
            'critical_stock_count' => $data->filter(function ($item) {
                return $item->current_stock <= $item->min_stock * 0.5;
            })->count(),
        ];

        return response()->json([
            'items' => $data,
            'summary' => $summary,
        ]);
    }
}

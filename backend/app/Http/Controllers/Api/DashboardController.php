<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Trip;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Client;
use App\Models\Inventory;
use App\Models\Invoice;
use App\Models\DailyMetrics;
use App\Models\Alert;
use App\Services\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index(Request $request)
    {
        $date = $request->date ?? now()->toDateString();

        // Today's metrics
        $todayTrips = Trip::whereDate('scheduled_date', $date)->count();
        $todayTons = Trip::whereDate('scheduled_date', $date)->sum('weight');
        $todayIncome = Trip::whereDate('scheduled_date', $date)->where('status', 'returned')->sum('total_amount');
        $todayExpenses = Trip::whereDate('scheduled_date', $date)
            ->where('status', 'returned')
            ->sum(DB::raw('COALESCE(fuel_cost, 0) + COALESCE(tolls_cost, 0) + COALESCE(maintenance_cost, 0) + COALESCE(other_cost, 0)'));

        // Active resources
        $activeTrucks = Truck::where('status', 'active')->count();
        $activeDrivers = Driver::where('status', 'active')->count();
        $tripsInProgress = Trip::where('status', 'in_transit')->count();

        // Inventory alerts
        $lowStockItems = Inventory::whereRaw('current_stock <= min_stock')->count();
        $criticalStockItems = Inventory::whereRaw('current_stock <= min_stock * 0.5')->count();

        // Pending invoices
        $pendingReceivable = Invoice::where('type', 'sale')
            ->where('status', '!=', 'paid')
            ->count();
        $overdueInvoices = Invoice::where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->count();

        // Recent alerts
        $recentAlerts = Alert::where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'date' => $date,
            'summary' => [
                'total_trips' => $todayTrips,
                'total_tons' => $todayTons,
                'total_income' => $todayIncome,
                'total_expenses' => $todayExpenses,
                'profit' => $todayIncome - $todayExpenses,
            ],
            'resources' => [
                'active_trucks' => $activeTrucks,
                'active_drivers' => $activeDrivers,
                'trips_in_progress' => $tripsInProgress,
            ],
            'alerts' => [
                'low_stock' => $lowStockItems,
                'critical_stock' => $criticalStockItems,
                'pending_receivable' => $pendingReceivable,
                'overdue_invoices' => $overdueInvoices,
            ],
            'recent_alerts' => $recentAlerts,
        ]);
    }

    public function getWeeklyStats(Request $request)
    {
        $startDate = $request->start_date ?? now()->subDays(6)->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $stats = Trip::whereBetween('scheduled_date', [$startDate, $endDate])
            ->select(
                'scheduled_date',
                DB::raw('COUNT(*) as total_trips'),
                DB::raw('SUM(weight) as total_tons'),
                DB::raw('SUM(total_amount) as total_income'),
                DB::raw('SUM(fuel_cost + tolls_cost + maintenance_cost + other_cost) as total_expenses')
            )
            ->groupBy('scheduled_date')
            ->get();

        return response()->json($stats);
    }

    public function getMonthlyStats(Request $request)
    {
        $year = $request->year ?? now()->year;
        $month = $request->month ?? now()->month;

        $stats = Trip::whereYear('scheduled_date', $year)
            ->whereMonth('scheduled_date', $month)
            ->select(
                DB::raw('DATE(scheduled_date) as date'),
                DB::raw('COUNT(*) as total_trips'),
                DB::raw('SUM(weight) as total_tons'),
                DB::raw('SUM(total_amount) as total_income'),
                DB::raw('SUM(fuel_cost + tolls_cost + maintenance_cost + other_cost) as total_expenses')
            )
            ->groupBy(DB::raw('DATE(scheduled_date)'))
            ->orderBy('date')
            ->get();

        return response()->json($stats);
    }

    public function getTopClients(Request $request)
    {
        $limit = $request->limit ?? 10;

        $topClients = Trip::select('client_id', DB::raw('COUNT(*) as trips'), DB::raw('SUM(weight) as tons'), DB::raw('SUM(total_amount) as revenue'))
            ->where('status', 'returned')
            ->groupBy('client_id')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->load('client');

        return response()->json($topClients);
    }

    public function getTripsByStatus()
    {
        $stats = Trip::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        return response()->json($stats);
    }

    public function getTrucksStatus()
    {
        $stats = Truck::select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        return response()->json($stats);
    }

    public function getFuelConsumption(Request $request)
    {
        $startDate = $request->start_date ?? now()->subDays(30)->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $consumption = Trip::whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->select(
                DB::raw('DATE(scheduled_date) as date'),
                DB::raw('SUM(fuel_consumed) as total_fuel'),
                DB::raw('SUM(fuel_cost) as total_fuel_cost'),
                DB::raw('SUM(distance) as total_distance')
            )
            ->groupBy(DB::raw('DATE(scheduled_date)'))
            ->orderBy('date')
            ->get();

        return response()->json($consumption);
    }

    public function getProfitability(Request $request)
    {
        $startDate = $request->start_date ?? now()->subDays(30)->toDateString();
        $endDate = $request->end_date ?? now()->toDateString();

        $profitability = Trip::whereBetween('scheduled_date', [$startDate, $endDate])
            ->where('status', 'returned')
            ->select(
                DB::raw('DATE(scheduled_date) as date'),
                DB::raw('SUM(total_amount) as revenue'),
                DB::raw('SUM(fuel_cost + tolls_cost + maintenance_cost + other_cost) as costs'),
                DB::raw('SUM(total_amount) - SUM(fuel_cost + tolls_cost + maintenance_cost + other_cost) as profit')
            )
            ->groupBy(DB::raw('DATE(scheduled_date)'))
            ->orderBy('date')
            ->get();

        return response()->json($profitability);
    }

    public function getMaintenanceAlerts()
    {
        $alerts = Alert::where('type', 'maintenance')
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($alerts);
    }

    public function getDocumentAlerts()
    {
        $truckAlerts = Truck::where(function ($query) {
            $query->whereRaw('insurance_end_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)')
                  ->orWhereRaw('circulation_card_expiry <= DATE_ADD(NOW(), INTERVAL 30 DAY)');
        })->get();

        $driverAlerts = Driver::whereRaw('license_expiry_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)')->get();

        return response()->json([
            'truck_alerts' => $truckAlerts,
            'driver_alerts' => $driverAlerts,
        ]);
    }

    /**
     * Llegadas de caliza del día: cada camión que llegó cargado,
     * cuánta carga trae, la fecha y hora de llegada.
     */
    public function getCalizaArrivals(Request $request)
    {
        $date = $request->date ?? now()->toDateString();

        $arrivals = Trip::with(['truck:id,plate', 'driver:id,name'])
            ->where('material_type', 'LIKE', '%caliza%')
            ->whereIn('status', [Trip::STATUS_DELIVERED, Trip::STATUS_RETURNED])
            ->whereDate('scheduled_date', $date)
            ->orderByDesc('return_time')
            ->orderByDesc('arrival_time')
            ->get()
            ->map(function (Trip $trip) {
                $load = $trip->getNetWeight() ?? $trip->weight;

                return [
                    'id' => $trip->id,
                    'truck_id' => $trip->truck_id,
                    'truck_plate' => $trip->truck?->plate,
                    'driver_id' => $trip->driver_id,
                    'driver_name' => $trip->driver?->name,
                    'material_type' => $trip->material_type,
                    'load_tons' => $load,
                    'arrival_time' => $trip->arrival_time,
                    'return_time' => $trip->return_time,
                    'arrived_at' => $trip->return_time ?? $trip->arrival_time,
                    'status' => $trip->status,
                    'client_name' => $trip->client?->name,
                ];
            });

        return response()->json([
            'date' => $date,
            'total_arrivals' => $arrivals->count(),
            'total_tons' => round($arrivals->sum('load_tons'), 2),
            'arrivals' => $arrivals,
        ]);
    }

    /**
     * Actividad diaria de un camionero: cuántas veces ha cargado
     * y los viajes que ha hecho en el día.
     */
    public function getDriverDailyTrips(Request $request, Driver $driver)
    {
        $date = $request->date ?? now()->toDateString();

        $trips = Trip::where('driver_id', $driver->id)
            ->whereDate('scheduled_date', $date)
            ->orderBy('scheduled_time')
            ->orderBy('id')
            ->get()
            ->map(function (Trip $trip) {
                return [
                    'id' => $trip->id,
                    'truck_plate' => $trip->truck?->plate,
                    'material_type' => $trip->material_type,
                    'load_tons' => $trip->getNetWeight() ?? $trip->weight,
                    'scheduled_time' => $trip->scheduled_time,
                    'departure_time' => $trip->departure_time,
                    'arrival_time' => $trip->arrival_time,
                    'return_time' => $trip->return_time,
                    'status' => $trip->status,
                    'client_name' => $trip->client?->name,
                ];
            });

        return response()->json([
            'driver' => [
                'id' => $driver->id,
                'name' => $driver->name,
            ],
            'date' => $date,
            'total_loads' => $trips->whereIn('status', [Trip::STATUS_DELIVERED, Trip::STATUS_RETURNED])->count(),
            'total_tons' => round($trips->whereIn('status', [Trip::STATUS_DELIVERED, Trip::STATUS_RETURNED])->sum('load_tons'), 2),
            'trips' => $trips,
        ]);
    }
}

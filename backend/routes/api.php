<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TruckController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\EmailSettingsController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\LoadProformaController;
use App\Http\Controllers\Api\DispatchController;
use App\Http\Controllers\Api\ControlController;
use App\Http\Controllers\Api\OfficeNoteController;
use App\Http\Controllers\Api\ExtraPaymentController;
use App\Http\Controllers\Api\PettyCashController;
use App\Http\Controllers\Api\PanamaController;
use App\Http\Controllers\Api\FleetController;
use App\Http\Controllers\Api\WhatsAppController;
use App\Http\Controllers\Api\SecretaryDashboardController;
use App\Http\Controllers\Api\SupervisorDashboardController;
use App\Http\Controllers\Api\AccountantDashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Routes for Caliza Los Osos Management System
|
*/

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Health check para Render
Route::get('/up', function () {
    return response()->json(['status' => 'ok']);
});

// WhatsApp Cloud API webhook (Meta llama sin autenticación)
Route::get('/whatsapp/webhook', [WhatsAppController::class, 'webhookVerify']);
Route::post('/whatsapp/webhook', [WhatsAppController::class, 'webhook']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes (acceso base: login/me/perfil)
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);

    // División política de Panamá (catálogo para captura de destinos)
    Route::get('/panama/locations', [PanamaController::class, 'locations']);

    // Gestión de usuarios (solo super_admin / admin)
    Route::middleware('screen:users')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::get('/auth/users', [AuthController::class, 'users']);
        Route::put('/auth/users/{user}', [AuthController::class, 'updateUser']);
        Route::delete('/auth/users/{user}', [AuthController::class, 'deleteUser']);
    });

    // Dashboard
    Route::middleware('screen:dashboard')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/dashboard/weekly-stats', [DashboardController::class, 'getWeeklyStats']);
        Route::get('/dashboard/monthly-stats', [DashboardController::class, 'getMonthlyStats']);
        Route::get('/dashboard/top-clients', [DashboardController::class, 'getTopClients']);
        Route::get('/dashboard/trips-by-status', [DashboardController::class, 'getTripsByStatus']);
        Route::get('/dashboard/trucks-status', [DashboardController::class, 'getTrucksStatus']);
        Route::get('/dashboard/fuel-consumption', [DashboardController::class, 'getFuelConsumption']);
        Route::get('/dashboard/profitability', [DashboardController::class, 'getProfitability']);
        Route::get('/dashboard/maintenance-alerts', [DashboardController::class, 'getMaintenanceAlerts']);
        Route::get('/dashboard/document-alerts', [DashboardController::class, 'getDocumentAlerts']);
        Route::get('/dashboard/caliza-arrivals', [DashboardController::class, 'getCalizaArrivals']);
        Route::get('/dashboard/driver-daily/{driver}', [DashboardController::class, 'getDriverDailyTrips']);
    });

    // Trucks
    Route::middleware('screen:trucks')->group(function () {
        Route::apiResource('trucks', TruckController::class);
        Route::get('/trucks/{truck}/maintenance-history', [TruckController::class, 'getMaintenanceHistory']);
        Route::post('/trucks/{truck}/maintenance', [TruckController::class, 'storeMaintenance']);
        Route::put('/trucks/{truck}/maintenance/{maintenance}', [TruckController::class, 'updateMaintenance']);
        Route::delete('/trucks/{truck}/maintenance/{maintenance}', [TruckController::class, 'destroyMaintenance']);
        Route::get('/trucks/{truck}/tires', [TruckController::class, 'getTires']);
        Route::post('/trucks/{truck}/tires', [TruckController::class, 'storeTire']);
        Route::put('/trucks/{truck}/tires/{tire}', [TruckController::class, 'updateTire']);
        Route::delete('/trucks/{truck}/tires/{tire}', [TruckController::class, 'destroyTire']);
        Route::put('/trucks/{truck}/mileage', [TruckController::class, 'updateMileage']);
    });

    // Drivers
    Route::middleware('screen:drivers')->group(function () {
        Route::apiResource('drivers', DriverController::class);
        Route::get('/drivers/{driver}/trips', [DriverController::class, 'getTrips']);
        Route::get('/drivers/{driver}/work-hours', [DriverController::class, 'getWorkHours']);
        Route::put('/drivers/{driver}/assign-truck', [DriverController::class, 'assignTruck']);
    });

    // Trips
    Route::middleware('screen:trips')->group(function () {
        Route::get('/trips/live', [TripController::class, 'liveVehicle']);
        Route::apiResource('trips', TripController::class);
        Route::put('/trips/{trip}/start', [TripController::class, 'startTrip']);
        Route::put('/trips/{trip}/deliver', [TripController::class, 'deliverTrip']);
        Route::put('/trips/{trip}/return', [TripController::class, 'returnTrip']);
        Route::put('/trips/{trip}/cancel', [TripController::class, 'cancelTrip']);
        Route::post('/trips/{trip}/evidence', [TripController::class, 'uploadEvidence']);
        Route::post('/trips/{trip}/location', [TripController::class, 'recordLocation']);
        Route::get('/trips/{trip}/location', [TripController::class, 'getLocation']);
        Route::get('/trips/{trip}/tracking', [TripController::class, 'tracking']);
        Route::post('/trips/{trip}/gross', [TripController::class, 'recordGross']);
        Route::post('/trips/{trip}/tare', [TripController::class, 'recordTare']);
        Route::post('/trips/{trip}/quality', [TripController::class, 'recordQuality']);
        Route::get('/trips/live/geofences', [TripController::class, 'liveGeoFences']);
        Route::get('/trips/by-date', [TripController::class, 'getTripsByDate']);
        Route::get('/trips/by-driver/{driver}', [TripController::class, 'getTripsByDriver']);
    });

    // Proformas de carga (cantera → planta / puntos de Panamá)
    Route::middleware('screen:proformas')->group(function () {
        Route::get('/proformas/live', [LoadProformaController::class, 'live']);
        Route::get('/proformas/summary', [LoadProformaController::class, 'summary']);
        Route::post('/proformas/{proforma}/location', [LoadProformaController::class, 'recordLocation']);
        Route::get('/proformas/{proforma}/location', [LoadProformaController::class, 'getLocation']);
        Route::get('/proformas/{proforma}/tracking', [LoadProformaController::class, 'tracking']);
        Route::apiResource('proformas', LoadProformaController::class);
    });

    // Flota en vivo unificada (viajes + cantera) — solo super_admin/admin
    Route::middleware('screen:live-map')->group(function () {
        Route::get('/fleet/live', [FleetController::class, 'live']);
    });

    // Controles de entrada/salida y pesaje (cantera y planta)
    Route::middleware('screen:controls')->group(function () {
        Route::get('/controls/summary', [ControlController::class, 'summary']);
        Route::apiResource('controls', ControlController::class);
    });

    // Despachos de producción (mercancía que sale de la planta)
    Route::middleware('screen:dispatches')->group(function () {
        Route::get('/dispatches/summary', [DispatchController::class, 'summary']);
        Route::apiResource('dispatches', DispatchController::class);
    });

    // Notas de oficina (secretaría: memorandos, minutas, oficios, comunicados)
    Route::middleware('screen:notes')->group(function () {
        Route::get('/notes/summary', [OfficeNoteController::class, 'summary']);
        Route::get('/notes/{note}/word', [OfficeNoteController::class, 'word']);
        Route::apiResource('notes', OfficeNoteController::class);
    });

    // Pagos extra dentro de la nómina
    Route::middleware('screen:payroll')->group(function () {
        Route::get('/extra-payments/summary', [ExtraPaymentController::class, 'summary']);
        Route::get('/extra-payments', [ExtraPaymentController::class, 'index']);
        Route::post('/extra-payments', [ExtraPaymentController::class, 'store']);
        Route::get('/extra-payments/{payment}', [ExtraPaymentController::class, 'show']);
        Route::put('/extra-payments/{payment}', [ExtraPaymentController::class, 'update']);
        Route::delete('/extra-payments/{payment}', [ExtraPaymentController::class, 'destroy']);
    });

    // Caja menuda
    Route::middleware('screen:petty-cash')->group(function () {
        Route::get('/petty-cash/summary', [PettyCashController::class, 'summary']);
        Route::get('/petty-cash', [PettyCashController::class, 'index']);
        Route::post('/petty-cash', [PettyCashController::class, 'store']);
        Route::get('/petty-cash/{cash}', [PettyCashController::class, 'show']);
        Route::put('/petty-cash/{cash}', [PettyCashController::class, 'update']);
        Route::delete('/petty-cash/{cash}', [PettyCashController::class, 'destroy']);
    });

    // Clients
    Route::middleware('screen:clients')->group(function () {
        Route::apiResource('clients', ClientController::class);
        Route::get('/clients/{client}/purchases', [ClientController::class, 'getPurchases']);
        Route::get('/clients/{client}/trips', [ClientController::class, 'getTrips']);
        Route::get('/clients/{client}/invoices', [ClientController::class, 'getInvoices']);
        Route::put('/clients/{client}/balance', [ClientController::class, 'updateBalance']);
    });

    // Inventory
    Route::middleware('screen:inventory')->group(function () {
        Route::apiResource('inventory', InventoryController::class);
        Route::post('/inventory/{inventory}/entry', [InventoryController::class, 'addEntry']);
        Route::post('/inventory/{inventory}/exit', [InventoryController::class, 'addExit']);
        Route::get('/inventory/{inventory}/movements', [InventoryController::class, 'getMovements']);
        Route::get('/inventory/low-stock', [InventoryController::class, 'getLowStock']);
        Route::get('/inventory/critical-stock', [InventoryController::class, 'getCriticalStock']);
    });

    // Invoices - custom routes before apiResource to avoid {invoice} capture
    Route::middleware('screen:invoices')->group(function () {
        Route::get('/invoices/overdue', [InvoiceController::class, 'getOverdueInvoices']);
        Route::get('/invoices/accounts-receivable', [InvoiceController::class, 'getAccountsReceivable']);
        Route::get('/invoices/accounts-payable', [InvoiceController::class, 'getAccountsPayable']);
        Route::apiResource('invoices', InvoiceController::class);
        Route::put('/invoices/{invoice}/send', [InvoiceController::class, 'markAsSent']);
        Route::put('/invoices/{invoice}/pay', [InvoiceController::class, 'markAsPaid']);
        Route::put('/invoices/{invoice}/overdue', [InvoiceController::class, 'markAsOverdue']);
        Route::put('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);
    });

    // Reports
    Route::middleware('screen:reports')->prefix('reports')->group(function () {
        Route::get('/tons-by-client', [ReportController::class, 'tonsByClient']);
        Route::get('/trip-profitability', [ReportController::class, 'tripProfitability']);
        Route::get('/fuel-consumption', [ReportController::class, 'fuelConsumption']);
        Route::get('/operation-costs', [ReportController::class, 'operationCosts']);
        Route::get('/financial-summary', [ReportController::class, 'financialSummary']);
        Route::get('/truck-performance', [ReportController::class, 'truckPerformance']);
        Route::get('/driver-performance', [ReportController::class, 'driverPerformance']);
        Route::get('/material-report', [ReportController::class, 'materialReport']);
        Route::get('/inventory-report', [ReportController::class, 'inventoryReport']);
    });

    // AI & Predictions
    Route::middleware('screen:ai')->prefix('ai')->group(function () {
        Route::get('/maintenance/{truckId}', [AIController::class, 'predictMaintenance']);
        Route::get('/fleet-predictions', [AIController::class, 'getFleetPredictions']);
        Route::post('/predict-trip-cost', [AIController::class, 'predictTripCost']);
        Route::post('/optimize-route', [AIController::class, 'optimizeRoute']);
    });

    // Email Settings
    Route::middleware('screen:settings-email')->prefix('settings')->group(function () {
        Route::get('/email', [EmailSettingsController::class, 'index']);
        Route::put('/email', [EmailSettingsController::class, 'update']);
        Route::post('/email/test-daily', [EmailSettingsController::class, 'testDaily']);
        Route::post('/email/test-alerts', [EmailSettingsController::class, 'testAlerts']);
    });

    // Suppliers
    Route::middleware('screen:suppliers')->group(function () {
        Route::apiResource('suppliers', SupplierController::class);
        Route::get('/suppliers/{supplier}/purchases', [SupplierController::class, 'getPurchases']);
        Route::get('/suppliers/{supplier}/invoices', [SupplierController::class, 'getInvoices']);
    });

    // Accounting
    Route::middleware('screen:accounting')->prefix('accounting')->group(function () {
        Route::get('/accounts-receivable', [AccountingController::class, 'getAccountsReceivable']);
        Route::get('/accounts-payable', [AccountingController::class, 'getAccountsPayable']);
        Route::post('/store-receivable', [AccountingController::class, 'storeReceivable']);
        Route::post('/store-payable', [AccountingController::class, 'storePayable']);
        Route::post('/receivable/{id}/pay', [AccountingController::class, 'markReceivablePaid']);
        Route::post('/payable/{id}/pay', [AccountingController::class, 'markPayablePaid']);
        Route::get('/receivable-summary', [AccountingController::class, 'getReceivableSummary']);
        Route::get('/payable-summary', [AccountingController::class, 'getPayableSummary']);
    });

    // Settings
    Route::middleware('screen:settings')->group(function () {
        Route::get('/settings/company', [SettingsController::class, 'getCompanyInfo']);
        Route::put('/settings/company', [SettingsController::class, 'updateCompanyInfo']);
        Route::get('/settings/all', [SettingsController::class, 'index']);
        Route::put('/settings', [SettingsController::class, 'update']);
    });

    // Payroll
    Route::middleware('screen:payroll')->group(function () {
        Route::apiResource('payrolls', PayrollController::class);
        Route::get('/payrolls/get-by-driver/{driver}', [PayrollController::class, 'getByDriver']);
        Route::put('/payrolls/{id}/approve', [PayrollController::class, 'approve']);
        Route::put('/payrolls/{id}/pay', [PayrollController::class, 'markAsPaid']);
    });

    // Mensajería WhatsApp (uso exclusivo de la secretaria)
    Route::middleware('screen:whatsapp')->prefix('whatsapp')->group(function () {
        Route::get('/status', [WhatsAppController::class, 'status']);
        Route::get('/summary', [WhatsAppController::class, 'summary']);
        Route::get('/conversations', [WhatsAppController::class, 'index']);
        Route::post('/conversations', [WhatsAppController::class, 'store']);
        Route::get('/conversations/{conversation}', [WhatsAppController::class, 'show']);
        Route::put('/conversations/{conversation}', [WhatsAppController::class, 'update']);
        Route::delete('/conversations/{conversation}', [WhatsAppController::class, 'destroy']);
        Route::post('/conversations/{conversation}/messages', [WhatsAppController::class, 'sendMessage']);
        Route::post('/conversations/{conversation}/receive', [WhatsAppController::class, 'receiveMessage']);
        Route::post('/conversations/{conversation}/read', [WhatsAppController::class, 'markRead']);
    });

    // Espacio de trabajo de la secretaria (agenda, recepción, archivo, logística)
    Route::middleware('screen:secretary-workspace')->prefix('secretary')->group(function () {
        Route::get('/summary', [SecretaryDashboardController::class, 'summary']);

        Route::get('/agenda', [SecretaryDashboardController::class, 'agendaIndex']);
        Route::post('/agenda', [SecretaryDashboardController::class, 'agendaStore']);
        Route::put('/agenda/{event}', [SecretaryDashboardController::class, 'agendaUpdate']);
        Route::delete('/agenda/{event}', [SecretaryDashboardController::class, 'agendaDestroy']);

        Route::get('/reception', [SecretaryDashboardController::class, 'receptionIndex']);
        Route::post('/reception', [SecretaryDashboardController::class, 'receptionStore']);
        Route::put('/reception/{record}', [SecretaryDashboardController::class, 'receptionUpdate']);
        Route::delete('/reception/{record}', [SecretaryDashboardController::class, 'receptionDestroy']);

        Route::get('/documents', [SecretaryDashboardController::class, 'documentsIndex']);
        Route::post('/documents', [SecretaryDashboardController::class, 'documentsStore']);
        Route::put('/documents/{doc}', [SecretaryDashboardController::class, 'documentsUpdate']);
        Route::delete('/documents/{doc}', [SecretaryDashboardController::class, 'documentsDestroy']);

        Route::get('/logistics', [SecretaryDashboardController::class, 'logisticsIndex']);
        Route::post('/logistics', [SecretaryDashboardController::class, 'logisticsStore']);
        Route::put('/logistics/{item}', [SecretaryDashboardController::class, 'logisticsUpdate']);
        Route::delete('/logistics/{item}', [SecretaryDashboardController::class, 'logisticsDestroy']);
    });

    // Espacio de trabajo del supervisor de planta (producción, calidad, seguridad, equipo)
    Route::middleware('screen:supervisor-workspace')->prefix('supervisor')->group(function () {
        Route::get('/summary', [SupervisorDashboardController::class, 'summary']);

        Route::get('/personnel', [SupervisorDashboardController::class, 'personnelIndex']);

        Route::get('/planning', [SupervisorDashboardController::class, 'planningIndex']);
        Route::post('/planning', [SupervisorDashboardController::class, 'planningStore']);
        Route::put('/planning/{item}', [SupervisorDashboardController::class, 'planningUpdate']);
        Route::delete('/planning/{item}', [SupervisorDashboardController::class, 'planningDestroy']);

        Route::get('/reception', [SupervisorDashboardController::class, 'receptionIndex']);
        Route::post('/reception', [SupervisorDashboardController::class, 'receptionStore']);
        Route::put('/reception/{item}', [SupervisorDashboardController::class, 'receptionUpdate']);
        Route::delete('/reception/{item}', [SupervisorDashboardController::class, 'receptionDestroy']);

        Route::get('/blending', [SupervisorDashboardController::class, 'blendingIndex']);
        Route::post('/blending', [SupervisorDashboardController::class, 'blendingStore']);
        Route::put('/blending/{item}', [SupervisorDashboardController::class, 'blendingUpdate']);
        Route::delete('/blending/{item}', [SupervisorDashboardController::class, 'blendingDestroy']);

        Route::get('/quality', [SupervisorDashboardController::class, 'qualityIndex']);
        Route::post('/quality', [SupervisorDashboardController::class, 'qualityStore']);
        Route::put('/quality/{item}', [SupervisorDashboardController::class, 'qualityUpdate']);
        Route::delete('/quality/{item}', [SupervisorDashboardController::class, 'qualityDestroy']);

        Route::get('/safety', [SupervisorDashboardController::class, 'safetyIndex']);
        Route::post('/safety', [SupervisorDashboardController::class, 'safetyStore']);
        Route::put('/safety/{item}', [SupervisorDashboardController::class, 'safetyUpdate']);
        Route::delete('/safety/{item}', [SupervisorDashboardController::class, 'safetyDestroy']);

        Route::get('/tasks', [SupervisorDashboardController::class, 'tasksIndex']);
        Route::post('/tasks', [SupervisorDashboardController::class, 'tasksStore']);
        Route::put('/tasks/{item}', [SupervisorDashboardController::class, 'tasksUpdate']);
        Route::delete('/tasks/{item}', [SupervisorDashboardController::class, 'tasksDestroy']);
    });

    // Gestión de personal de planta (Super Admin / Admin / Secretaria)
    Route::middleware('screen:personnel')->prefix('personnel')->group(function () {
        Route::get('/', [SupervisorDashboardController::class, 'personnelIndex']);
        Route::post('/', [SupervisorDashboardController::class, 'personnelStore']);
        Route::put('/{item}', [SupervisorDashboardController::class, 'personnelUpdate']);
        Route::delete('/{item}', [SupervisorDashboardController::class, 'personnelDestroy']);
    });

    // Espacio de trabajo del contador de costos (costos, activos, presupuestos, cumplimiento)
    Route::middleware('screen:accountant-workspace')->prefix('accountant')->group(function () {
        Route::get('/summary', [AccountantDashboardController::class, 'summary']);

        Route::get('/costs', [AccountantDashboardController::class, 'costsIndex']);
        Route::post('/costs', [AccountantDashboardController::class, 'costsStore']);
        Route::put('/costs/{item}', [AccountantDashboardController::class, 'costsUpdate']);
        Route::delete('/costs/{item}', [AccountantDashboardController::class, 'costsDestroy']);

        Route::get('/assets', [AccountantDashboardController::class, 'assetsIndex']);
        Route::post('/assets', [AccountantDashboardController::class, 'assetsStore']);
        Route::put('/assets/{item}', [AccountantDashboardController::class, 'assetsUpdate']);
        Route::delete('/assets/{item}', [AccountantDashboardController::class, 'assetsDestroy']);

        Route::get('/budgets', [AccountantDashboardController::class, 'budgetsIndex']);
        Route::post('/budgets', [AccountantDashboardController::class, 'budgetsStore']);
        Route::put('/budgets/{item}', [AccountantDashboardController::class, 'budgetsUpdate']);
        Route::delete('/budgets/{item}', [AccountantDashboardController::class, 'budgetsDestroy']);

        Route::get('/compliance', [AccountantDashboardController::class, 'complianceIndex']);
        Route::post('/compliance', [AccountantDashboardController::class, 'complianceStore']);
        Route::put('/compliance/{item}', [AccountantDashboardController::class, 'complianceUpdate']);
        Route::delete('/compliance/{item}', [AccountantDashboardController::class, 'complianceDestroy']);
    });
});

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Truck;
use App\Models\Maintenance;
use App\Models\Tire;
use App\Services\FirebaseService;
use Illuminate\Http\Request;

class TruckController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index()
    {
        $trucks = Truck::all();
        return response()->json($trucks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'plate' => 'required|string|max:10|unique:trucks',
            'brand' => 'required|string|max:100',
            'model' => 'required|string|max:100',
            'year' => 'required|integer|min:1900|max:' . (date('Y') + 1),
            'color' => 'nullable|string|max:50',
            'vin_number' => 'nullable|string|max:17|unique:trucks',
            'engine_type' => 'nullable|string|max:50',
            'capacity' => 'required|numeric|min:0',
            'current_mileage' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,maintenance,inactive',
            'insurance_provider' => 'nullable|string|max:100',
            'insurance_policy_number' => 'nullable|string|max:50',
            'insurance_start_date' => 'nullable|date',
            'insurance_end_date' => 'nullable|date|after:insurance_start_date',
            'insurance_cost' => 'nullable|numeric|min:0',
            'circulation_card_number' => 'nullable|string|max:50',
            'circulation_card_expiry' => 'nullable|date',
        ]);

        $truck = Truck::create($request->all());

        if ($this->firebase->isConfigured()) {
            $this->firebase->createTruck($truck->toArray());
        }

        return response()->json($truck, 201);
    }

    public function show(Truck $truck)
    {
        return response()->json($truck);
    }

    public function update(Request $request, Truck $truck)
    {
        $request->validate([
            'plate' => 'sometimes|string|max:10|unique:trucks,plate,' . $truck->id,
            'brand' => 'sometimes|string|max:100',
            'model' => 'sometimes|string|max:100',
            'year' => 'sometimes|integer|min:1900|max:' . (date('Y') + 1),
            'color' => 'nullable|string|max:50',
            'vin_number' => 'nullable|string|max:17|unique:trucks,vin_number,' . $truck->id,
            'engine_type' => 'nullable|string|max:50',
            'capacity' => 'sometimes|numeric|min:0',
            'current_mileage' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,maintenance,inactive',
            'insurance_provider' => 'nullable|string|max:100',
            'insurance_policy_number' => 'nullable|string|max:50',
            'insurance_start_date' => 'nullable|date',
            'insurance_end_date' => 'nullable|date|after:insurance_start_date',
            'insurance_cost' => 'nullable|numeric|min:0',
            'circulation_card_number' => 'nullable|string|max:50',
            'circulation_card_expiry' => 'nullable|date',
        ]);

        $truck->update($request->all());

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateTruck($truck->id, $truck->toArray());
        }

        return response()->json($truck);
    }

    public function destroy(Truck $truck)
    {
        $truck->delete();

        if ($this->firebase->isConfigured()) {
            $this->firebase->deleteTruck($truck->id);
        }

        return response()->json(['message' => 'Camión eliminado correctamente']);
    }

    public function getMaintenanceHistory(Truck $truck)
    {
        $maintenance = $truck->maintenanceRecords()->orderBy('service_date', 'desc')->get();
        return response()->json($maintenance);
    }

    public function storeMaintenance(Request $request, Truck $truck)
    {
        $validated = $request->validate([
            'type' => 'required|in:preventive,corrective,emergency',
            'description' => 'nullable|string|max:1000',
            'service_date' => 'nullable|date',
            'mileage_at_service' => 'nullable|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:scheduled,in_progress,completed',
            'next_maintenance_date' => 'nullable|date',
            'next_mileage' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $maintenance = $truck->maintenanceRecords()->create($validated);

        return response()->json($maintenance, 201);
    }

    public function updateMaintenance(Request $request, Truck $truck, Maintenance $maintenance)
    {
        $this->assertMaintenanceBelongsToTruck($truck, $maintenance);

        $validated = $request->validate([
            'type' => 'sometimes|in:preventive,corrective,emergency',
            'description' => 'nullable|string|max:1000',
            'service_date' => 'nullable|date',
            'mileage_at_service' => 'nullable|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:scheduled,in_progress,completed',
            'next_maintenance_date' => 'nullable|date',
            'next_mileage' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $maintenance->update($validated);

        return response()->json($maintenance);
    }

    public function destroyMaintenance(Truck $truck, Maintenance $maintenance)
    {
        $this->assertMaintenanceBelongsToTruck($truck, $maintenance);
        $maintenance->delete();

        return response()->json(['message' => 'Registro de mantenimiento eliminado']);
    }

    protected function assertMaintenanceBelongsToTruck(Truck $truck, Maintenance $maintenance): void
    {
        if ($maintenance->truck_id !== $truck->id) {
            abort(404, 'Mantenimiento no encontrado para este camión');
        }
    }

    public function getTires(Truck $truck)
    {
        $tires = $truck->tires()->get();
        return response()->json($tires);
    }

    public function storeTire(Request $request, Truck $truck)
    {
        $validated = $request->validate([
            'position' => 'required|string|max:100',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'install_date' => 'nullable|date',
            'current_mileage' => 'nullable|numeric|min:0',
            'max_mileage' => 'nullable|numeric|min:0',
            'pressure' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:good,worn,needs_replacement',
        ]);

        $tire = $truck->tires()->create($validated);

        return response()->json($tire, 201);
    }

    public function updateTire(Request $request, Truck $truck, Tire $tire)
    {
        $this->assertTireBelongsToTruck($truck, $tire);

        $validated = $request->validate([
            'position' => 'sometimes|string|max:100',
            'brand' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'serial_number' => 'nullable|string|max:100',
            'install_date' => 'nullable|date',
            'current_mileage' => 'nullable|numeric|min:0',
            'max_mileage' => 'nullable|numeric|min:0',
            'pressure' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:good,worn,needs_replacement',
        ]);

        $tire->update($validated);

        return response()->json($tire);
    }

    public function destroyTire(Truck $truck, Tire $tire)
    {
        $this->assertTireBelongsToTruck($truck, $tire);
        $tire->delete();

        return response()->json(['message' => 'Llanta eliminada']);
    }

    protected function assertTireBelongsToTruck(Truck $truck, Tire $tire): void
    {
        if ($tire->truck_id !== $truck->id) {
            abort(404, 'Llanta no encontrada para este camión');
        }
    }

    public function updateMileage(Request $request, Truck $truck)
    {
        $request->validate([
            'mileage' => 'required|numeric|min:' . $truck->current_mileage,
        ]);

        $truck->update(['current_mileage' => $request->mileage]);

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateTruck($truck->id, ['current_mileage' => $request->mileage]);
        }

        return response()->json($truck);
    }
}

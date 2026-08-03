<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\User;
use App\Services\FirebaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class DriverController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index()
    {
        $drivers = Driver::with('user', 'currentTruck')->get();
        return response()->json($drivers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:20',
            'license_number' => 'required|string|max:50',
            'license_type' => 'required|string|max:10',
            'license_expiry_date' => 'required|date',
            'license_issued_by' => 'nullable|string|max:100',
            'curp' => 'nullable|string|max:18',
            'rfc' => 'nullable|string|max:13',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relationship' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'hire_date' => 'required|date',
        ]);

        // Create user account
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'driver',
            'phone' => $request->phone,
        ]);

        // Create driver profile
        $driver = Driver::create([
            'user_id' => $user->id,
            'name' => $request->name,
            'license_number' => $request->license_number,
            'license_type' => $request->license_type,
            'license_expiry_date' => $request->license_expiry_date,
            'license_issued_by' => $request->license_issued_by,
            'curp' => $request->curp,
            'rfc' => $request->rfc,
            'phone' => $request->phone,
            'emergency_contact_name' => $request->emergency_contact_name,
            'emergency_contact_phone' => $request->emergency_contact_phone,
            'emergency_contact_relationship' => $request->emergency_contact_relationship,
            'address' => $request->address,
            'hire_date' => $request->hire_date,
            'status' => 'active',
            'total_trips' => 0,
            'total_hours_worked' => 0,
            'rating' => 0,
        ]);

        if ($this->firebase->isConfigured()) {
            $this->firebase->createDriver($driver->toArray());
        }

        return response()->json([
            'user' => $user,
            'driver' => $driver,
        ], 201);
    }

    public function show(Driver $driver)
    {
        $driver->load('user', 'currentTruck', 'trips');
        return response()->json($driver);
    }

    public function update(Request $request, Driver $driver)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'license_number' => 'sometimes|string|max:50',
            'license_type' => 'sometimes|string|max:10',
            'license_expiry_date' => 'sometimes|date',
            'license_issued_by' => 'nullable|string|max:100',
            'curp' => 'nullable|string|max:18',
            'rfc' => 'nullable|string|max:13',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:20',
            'emergency_contact_relationship' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'status' => 'sometimes|in:active,inactive,on_trip',
            'current_truck_id' => 'nullable|exists:trucks,id',
            'rating' => 'nullable|numeric|min:0|max:5',
        ]);

        $driver->update($request->all());

        // Update user if name or phone changed
        if (($request->has('name') || $request->has('phone')) && $driver->user) {
            $driver->user->update([
                'name' => $request->name ?? $driver->user->name,
                'phone' => $request->phone ?? $driver->user->phone,
            ]);
        }

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateDriver($driver->id, $driver->toArray());
        }

        return response()->json($driver);
    }

    public function destroy(Driver $driver)
    {
        // Delete user account (if present)
        if ($driver->user) {
            $driver->user->delete();
        }
        $driver->delete();

        if ($this->firebase->isConfigured()) {
            $this->firebase->deleteDriver($driver->id);
        }

        return response()->json(['message' => 'Conductor eliminado correctamente']);
    }

    public function getTrips(Driver $driver)
    {
        $trips = $driver->trips()->orderBy('scheduled_date', 'desc')->get();
        return response()->json($trips);
    }

    public function getWorkHours(Driver $driver)
    {
        $workHours = $driver->workHours()->orderBy('date', 'desc')->get();
        return response()->json($workHours);
    }

    public function assignTruck(Request $request, Driver $driver)
    {
        $request->validate([
            'truck_id' => 'required|exists:trucks,id',
        ]);

        $driver->update(['current_truck_id' => $request->truck_id]);

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateDriver($driver->id, ['current_truck_id' => $request->truck_id]);
        }

        return response()->json($driver);
    }
}

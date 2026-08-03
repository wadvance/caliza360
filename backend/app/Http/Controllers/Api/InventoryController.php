<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Services\FirebaseService;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index()
    {
        $inventory = Inventory::all();
        return response()->json($inventory);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'material_type' => 'required|string|max:100',
            'unit' => 'nullable|string|max:50',
            'location' => 'required|string|max:255',
            'current_stock' => 'required|numeric|min:0',
            'min_stock' => 'required|numeric|min:0',
            'max_stock' => 'required|numeric|min:0|gte:min_stock',
            'unit_cost' => 'required|numeric|min:0',
        ]);

        $data = $request->all();
        if (empty($data['name'])) {
            $data['name'] = $data['material_type'];
        }
        if (empty($data['unit'])) {
            $data['unit'] = 'ton';
        }

        $inventory = Inventory::create([
            ...$data,
            'status' => 'normal',
        ]);

        if ($this->firebase->isConfigured()) {
            $this->firebase->createInventory($inventory->toArray());
        }

        return response()->json($inventory, 201);
    }

    public function show(Inventory $inventory)
    {
        return response()->json($inventory);
    }

    public function update(Request $request, Inventory $inventory)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'material_type' => 'sometimes|string|max:100',
            'unit' => 'sometimes|string|max:50',
            'location' => 'sometimes|string|max:255',
            'min_stock' => 'sometimes|numeric|min:0',
            'max_stock' => 'sometimes|numeric|min:0|gte:min_stock',
            'unit_cost' => 'sometimes|numeric|min:0',
        ]);

        $inventory->update($request->all());
        $inventory->updateStatus();

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateInventory($inventory->id, $inventory->toArray());
        }

        return response()->json($inventory);
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();

        if ($this->firebase->isConfigured()) {
            $this->firebase->deleteInventory($inventory->id);
        }

        return response()->json(['message' => 'Inventario eliminado correctamente']);
    }

    public function addEntry(Request $request, Inventory $inventory)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'nullable|numeric|min:0',
            'reference' => 'nullable|string|max:255',
            'trip_id' => 'nullable|exists:trips,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $unitCost = $request->unit_cost ?? $inventory->unit_cost;
        $totalCost = $request->quantity * $unitCost;

        // Create movement
        $movement = InventoryMovement::create([
            'inventory_id' => $inventory->id,
            'type' => 'entry',
            'quantity' => $request->quantity,
            'unit_cost' => $unitCost,
            'total_cost' => $totalCost,
            'reference' => $request->reference,
            'trip_id' => $request->trip_id,
            'supplier_id' => $request->supplier_id,
            'notes' => $request->notes,
        ]);

        // Update inventory
        $inventory->current_stock += $request->quantity;
        $inventory->last_entry = now();
        $inventory->updateStatus();
        $inventory->save();

        if ($this->firebase->isConfigured()) {
            $this->firebase->addInventoryMovement($inventory->id, $movement->toArray());
            $this->firebase->updateInventory($inventory->id, $inventory->toArray());
        }

        return response()->json([
            'inventory' => $inventory,
            'movement' => $movement,
        ], 201);
    }

    public function addExit(Request $request, Inventory $inventory)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:255',
            'trip_id' => 'nullable|exists:trips,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($request->quantity > $inventory->current_stock) {
            return response()->json(['message' => 'Stock insuficiente'], 400);
        }

        // Create movement
        $movement = InventoryMovement::create([
            'inventory_id' => $inventory->id,
            'type' => 'exit',
            'quantity' => $request->quantity,
            'unit_cost' => $inventory->unit_cost,
            'total_cost' => $request->quantity * $inventory->unit_cost,
            'reference' => $request->reference,
            'trip_id' => $request->trip_id,
            'notes' => $request->notes,
        ]);

        // Update inventory
        $inventory->current_stock -= $request->quantity;
        $inventory->last_exit = now();
        $inventory->updateStatus();
        $inventory->save();

        if ($this->firebase->isConfigured()) {
            $this->firebase->addInventoryMovement($inventory->id, $movement->toArray());
            $this->firebase->updateInventory($inventory->id, $inventory->toArray());
        }

        return response()->json([
            'inventory' => $inventory,
            'movement' => $movement,
        ], 201);
    }

    public function getMovements(Inventory $inventory)
    {
        $movements = $inventory->movements()->orderBy('created_at', 'desc')->get();
        return response()->json($movements);
    }

    public function getLowStock()
    {
        $lowStock = Inventory::whereRaw('current_stock <= min_stock')->get();
        return response()->json($lowStock);
    }

    public function getCriticalStock()
    {
        $criticalStock = Inventory::whereRaw('current_stock <= min_stock * 0.5')->get();
        return response()->json($criticalStock);
    }
}

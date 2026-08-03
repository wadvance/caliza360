<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\FirebaseService;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index()
    {
        $suppliers = Supplier::all();
        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'company' => 'nullable|string|max:255',
            'rfc' => 'nullable|string|max:13|unique:suppliers',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:1000',
            'material_type' => 'nullable|string|max:100',
            'payment_terms' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $supplier = Supplier::create([
            ...$request->all(),
            'total_purchases' => 0,
            'outstanding_balance' => 0,
            'rating' => 0,
        ]);

        if ($this->firebase->isConfigured()) {
            $this->firebase->createSupplier($supplier->toArray());
        }

        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier)
    {
        return response()->json($supplier);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'company' => 'nullable|string|max:255',
            'rfc' => 'nullable|string|max:13|unique:suppliers,rfc,' . $supplier->id,
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:1000',
            'material_type' => 'nullable|string|max:100',
            'payment_terms' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $supplier->update($request->all());

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateSupplier($supplier->id, $supplier->toArray());
        }

        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        if ($this->firebase->isConfigured()) {
            $this->firebase->deleteSupplier($supplier->id);
        }

        return response()->json(['message' => 'Proveedor eliminado correctamente']);
    }

    public function getPurchases(Supplier $supplier)
    {
        $purchases = $supplier->purchases()->orderBy('date', 'desc')->get();
        return response()->json($purchases);
    }

    public function getInvoices(Supplier $supplier)
    {
        $invoices = $supplier->invoices()->orderBy('issue_date', 'desc')->get();
        return response()->json($invoices);
    }
}

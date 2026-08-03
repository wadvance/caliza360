<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Client;
use App\Models\Supplier;
use App\Services\FirebaseService;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index(Request $request)
    {
        $query = Invoice::with('client', 'supplier');

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        $invoices = $query->orderBy('issue_date', 'desc')->get();

        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|in:sale,purchase',
            'client_id' => 'required_if:type,sale|exists:clients,id',
            'supplier_id' => 'required_if:type,purchase|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.material_type' => 'nullable|string|max:100',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after:issue_date',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Calculate totals
        $subtotal = 0;
        $items = $request->items;
        foreach ($items as &$item) {
            $item['total'] = $item['quantity'] * $item['unit_price'];
            $subtotal += $item['total'];
        }

        $iva = $subtotal * 0.16;
        $total = $subtotal + $iva;

        // Generate invoice number
        $lastInvoice = Invoice::where('type', $request->type)->latest()->first();
        $number = $lastInvoice ? intval(substr($lastInvoice->invoice_number, -4)) + 1 : 1;
        $invoiceNumber = strtoupper($request->type === 'sale' ? 'FAC' : 'COMP') . '-' . date('Y') . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'type' => $request->type,
            'client_id' => $request->client_id,
            'supplier_id' => $request->supplier_id,
            'items' => $items,
            'subtotal' => $subtotal,
            'iva' => $iva,
            'total' => $total,
            'issue_date' => $request->issue_date,
            'due_date' => $request->due_date,
            'status' => 'draft',
            'notes' => $request->notes,
        ]);

        // Update client/supplier balance
        if ($request->type === 'sale' && $request->client_id) {
            $client = Client::find($request->client_id);
            $client->current_balance += $total;
            $client->total_purchases += $total;
            $client->save();
        } elseif ($request->type === 'purchase' && $request->supplier_id) {
            $supplier = Supplier::find($request->supplier_id);
            $supplier->outstanding_balance += $total;
            $supplier->total_purchases += $total;
            $supplier->save();
        }

        if ($this->firebase->isConfigured()) {
            $this->firebase->createInvoice($invoice->toArray());
        }

        return response()->json($invoice, 201);
    }

    public function show(Invoice $invoice)
    {
        $invoice->load('client', 'supplier');
        return response()->json($invoice);
    }

    public function update(Request $request, Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'No se puede editar una factura pagada'], 400);
        }

        $request->validate([
            'items' => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string|max:255',
            'items.*.quantity' => 'required_with:items|numeric|min:0.01',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'items.*.material_type' => 'nullable|string|max:100',
            'issue_date' => 'sometimes|date',
            'due_date' => 'sometimes|date|after:issue_date',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Recalculate if items changed
        if ($request->has('items')) {
            $subtotal = 0;
            $items = $request->items;
            foreach ($items as &$item) {
                $item['total'] = $item['quantity'] * $item['unit_price'];
                $subtotal += $item['total'];
            }

            $iva = $subtotal * 0.16;
            $total = $subtotal + $iva;

            $invoice->items = $items;
            $invoice->subtotal = $subtotal;
            $invoice->iva = $iva;
            $invoice->total = $total;
        }

        $invoice->update($request->except(['items', 'subtotal', 'iva', 'total']));

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateInvoice($invoice->id, $invoice->toArray());
        }

        return response()->json($invoice);
    }

    public function destroy(Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'No se puede eliminar una factura pagada'], 400);
        }

        // Reverse balance changes
        if ($invoice->type === 'sale' && $invoice->client_id) {
            $client = Client::find($invoice->client_id);
            $client->current_balance -= $invoice->total;
            $client->total_purchases -= $invoice->total;
            $client->save();
        } elseif ($invoice->type === 'purchase' && $invoice->supplier_id) {
            $supplier = Supplier::find($invoice->supplier_id);
            $supplier->outstanding_balance -= $invoice->total;
            $supplier->total_purchases -= $invoice->total;
            $supplier->save();
        }

        $invoice->delete();

        if ($this->firebase->isConfigured()) {
            $this->firebase->deleteInvoice($invoice->id);
        }

        return response()->json(['message' => 'Factura eliminada correctamente']);
    }

    public function markAsSent(Invoice $invoice)
    {
        if ($invoice->status !== 'draft') {
            return response()->json(['message' => 'La factura no está en borrador'], 400);
        }

        $invoice->update(['status' => 'sent']);

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateInvoice($invoice->id, ['status' => 'sent']);
        }

        return response()->json($invoice);
    }

    public function markAsPaid(Request $request, Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'La factura ya está pagada'], 400);
        }

        $request->validate([
            'payment_method' => 'required|string|max:50',
            'payment_date' => 'required|date',
        ]);

        $invoice->update([
            'status' => 'paid',
            'payment_method' => $request->payment_method,
            'payment_date' => $request->payment_date,
        ]);

        // Update client/supplier balance
        if ($invoice->type === 'sale' && $invoice->client_id) {
            $client = Client::find($invoice->client_id);
            $client->current_balance -= $invoice->total;
            $client->save();
        } elseif ($invoice->type === 'purchase' && $invoice->supplier_id) {
            $supplier = Supplier::find($invoice->supplier_id);
            $supplier->outstanding_balance -= $invoice->total;
            $supplier->save();
        }

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateInvoice($invoice->id, $invoice->toArray());
        }

        return response()->json($invoice);
    }

    public function markAsOverdue(Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'La factura ya está pagada'], 400);
        }

        $invoice->update(['status' => 'overdue']);

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateInvoice($invoice->id, ['status' => 'overdue']);
        }

        return response()->json($invoice);
    }

    public function cancel(Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'No se puede cancelar una factura pagada'], 400);
        }

        // Reverse balance changes
        if ($invoice->type === 'sale' && $invoice->client_id) {
            $client = Client::find($invoice->client_id);
            $client->current_balance -= $invoice->total;
            $client->total_purchases -= $invoice->total;
            $client->save();
        } elseif ($invoice->type === 'purchase' && $invoice->supplier_id) {
            $supplier = Supplier::find($invoice->supplier_id);
            $supplier->outstanding_balance -= $invoice->total;
            $supplier->total_purchases -= $invoice->total;
            $supplier->save();
        }

        $invoice->update(['status' => 'cancelled']);

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateInvoice($invoice->id, ['status' => 'cancelled']);
        }

        return response()->json($invoice);
    }

    public function getOverdueInvoices()
    {
        $overdueInvoices = Invoice::with('client', 'supplier')
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', now())
            ->get();

        return response()->json($overdueInvoices);
    }

    public function getAccountsReceivable()
    {
        $receivable = Invoice::with('client')
            ->where('type', 'sale')
            ->where('status', '!=', 'paid')
            ->get();

        return response()->json($receivable);
    }

    public function getAccountsPayable()
    {
        $payable = Invoice::with('supplier')
            ->where('type', 'purchase')
            ->where('status', '!=', 'paid')
            ->get();

        return response()->json($payable);
    }
}

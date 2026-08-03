<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExtraPayment;
use Illuminate\Http\Request;

class ExtraPaymentController extends Controller
{
    /**
     * Pagos extra dentro de los parámetros de la nómina (bonos, horas extra, apoyos).
     */
    public function index(Request $request)
    {
        $query = ExtraPayment::with(['driver:id,name', 'payroll:id,period', 'creator:id,name'])
            ->orderByDesc('payment_date')
            ->orderByDesc('id');

        if ($request->filled('driver_id')) {
            $query->where('driver_id', $request->driver_id);
        }

        if ($request->filled('payroll_id')) {
            $query->where('payroll_id', $request->payroll_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('start_date')) {
            $query->whereDate('payment_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('payment_date', '<=', $request->end_date);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $data['created_by'] = $request->user()->id;

        $payment = ExtraPayment::create($data);

        return response()->json($payment->load(['driver:id,name', 'payroll:id,period', 'creator:id,name']), 201);
    }

    public function show(ExtraPayment $payment)
    {
        return response()->json($payment->load(['driver:id,name', 'payroll:id,period', 'creator:id,name']));
    }

    public function update(Request $request, ExtraPayment $payment)
    {
        $data = $this->validateData($request);

        $payment->update($data);

        return response()->json($payment->load(['driver:id,name', 'payroll:id,period', 'creator:id,name']));
    }

    public function destroy(ExtraPayment $payment)
    {
        $payment->delete();

        return response()->json(['message' => 'Pago extra eliminado correctamente']);
    }

    /**
     * Resumen de pagos extra por conductor y totales.
     */
    public function summary(Request $request)
    {
        $query = ExtraPayment::query();

        if ($request->filled('start_date')) {
            $query->whereDate('payment_date', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->whereDate('payment_date', '<=', $request->end_date);
        }

        $scope = (clone $query)->get();

        $byDriver = (clone $query)
            ->select('driver_id')
            ->selectRaw('COUNT(*) as total_payments')
            ->selectRaw('SUM(amount) as total_amount')
            ->with('driver:id,name')
            ->groupBy('driver_id')
            ->get();

        return response()->json([
            'total_payments' => $scope->count(),
            'total_amount' => round($scope->sum('amount'), 2),
            'total_pending' => (clone $query)->where('status', ExtraPayment::STATUS_PENDING)->count(),
            'by_driver' => $byDriver,
        ]);
    }

    protected function validateData(Request $request): array
    {
        return $request->validate([
            'driver_id' => 'required|exists:drivers,id',
            'payroll_id' => 'nullable|exists:payrolls,id',
            'concept' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'status' => 'required|in:' . implode(',', ExtraPayment::STATUSES),
        ]);
    }
}

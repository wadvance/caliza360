<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PayrollController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function index(): JsonResponse
    {
        $payrolls = Payroll::with('driver')->orderBy('created_at', 'desc')->get();
        return response()->json($payrolls);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'driver_id' => 'required|exists:drivers,id',
            'period' => 'required|string|max:50',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'base_salary' => 'required|numeric|min:0',
            'overtime_hours' => 'nullable|numeric|min:0',
            'overtime_rate' => 'nullable|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'bonuses' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'taxes' => 'nullable|numeric|min:0',
            'trips_completed' => 'nullable|integer|min:0',
            'total_hours_worked' => 'nullable|numeric|min:0',
        ]);

        $overtimePay = $request->overtime_pay
            ?? ($request->overtime_hours ?? 0) * ($request->overtime_rate ?? 0);

        $netPay = ($request->base_salary + $overtimePay + ($request->bonuses ?? 0))
            - ($request->deductions ?? 0) - ($request->taxes ?? 0);

        $payroll = Payroll::create([
            ...$request->all(),
            'overtime_pay' => $overtimePay,
            'net_pay' => $netPay,
            'status' => Payroll::STATUS_DRAFT,
        ]);

        return response()->json($payroll, 201);
    }

    public function show(Payroll $payroll): JsonResponse
    {
        $payroll->load('driver');
        return response()->json($payroll);
    }

    public function update(Request $request, Payroll $payroll): JsonResponse
    {
        $request->validate([
            'driver_id' => 'sometimes|exists:drivers,id',
            'period' => 'sometimes|string|max:50',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'base_salary' => 'sometimes|numeric|min:0',
            'overtime_hours' => 'nullable|numeric|min:0',
            'overtime_rate' => 'nullable|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'bonuses' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'taxes' => 'nullable|numeric|min:0',
            'trips_completed' => 'nullable|integer|min:0',
            'total_hours_worked' => 'nullable|numeric|min:0',
        ]);

        $payroll->update($request->all());

        $overtimePay = $request->overtime_pay
            ?? ($request->overtime_hours ?? 0) * ($request->overtime_rate ?? 0);

        $netPay = ($request->base_salary + $overtimePay + ($request->bonuses ?? 0))
            - ($request->deductions ?? 0) - ($request->taxes ?? 0);

        $payroll->update(['overtime_pay' => $overtimePay, 'net_pay' => $netPay]);

        return response()->json($payroll);
    }

    public function destroy(Payroll $payroll): JsonResponse
    {
        $payroll->delete();
        return response()->json(['message' => 'Nómina eliminada correctamente']);
    }

    public function getByDriver($driver): JsonResponse
    {
        $payrolls = Payroll::where('driver_id', $driver)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($payrolls);
    }

    public function approve(Payroll $payroll): JsonResponse
    {
        $payroll->update(['status' => Payroll::STATUS_APPROVED]);
        return response()->json($payroll);
    }

    public function markAsPaid(Payroll $payroll): JsonResponse
    {
        $payroll->update([
            'status' => Payroll::STATUS_PAID,
            'payment_date' => now(),
        ]);
        return response()->json($payroll);
    }
}

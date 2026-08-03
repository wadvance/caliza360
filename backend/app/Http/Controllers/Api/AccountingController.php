<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountReceivable;
use App\Models\AccountPayable;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    protected $firebase;

    public function __construct(FirebaseService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function getAccountsReceivable(Request $request): JsonResponse
    {
        $query = AccountReceivable::with('client', 'invoice');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $accounts = $query->orderBy('due_date', 'desc')->get();
        return response()->json($accounts);
    }

    public function getAccountsPayable(Request $request): JsonResponse
    {
        $query = AccountPayable::with('supplier', 'invoice');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $accounts = $query->orderBy('due_date', 'desc')->get();
        return response()->json($accounts);
    }

    public function storeReceivable(Request $request): JsonResponse
    {
        $request->validate([
            'client_id' => 'required|exists:clients,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
        ]);

        $account = AccountReceivable::create([
            'client_id' => $request->client_id,
            'invoice_id' => $request->invoice_id,
            'amount' => $request->amount,
            'paid_amount' => 0,
            'balance' => $request->amount,
            'due_date' => $request->due_date,
            'status' => AccountReceivable::STATUS_PENDING,
        ]);

        return response()->json($account, 201);
    }

    public function storePayable(Request $request): JsonResponse
    {
        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'invoice_id' => 'nullable|exists:invoices,id',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
        ]);

        $account = AccountPayable::create([
            'supplier_id' => $request->supplier_id,
            'invoice_id' => $request->invoice_id,
            'amount' => $request->amount,
            'paid_amount' => 0,
            'balance' => $request->amount,
            'due_date' => $request->due_date,
            'status' => AccountPayable::STATUS_PENDING,
        ]);

        return response()->json($account, 201);
    }

    public function markReceivablePaid(AccountReceivable $account, Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
        ]);

        $account->paid_amount += $request->amount;
        $account->balance = $account->amount - $account->paid_amount;

        if ($account->balance <= 0) {
            $account->status = AccountReceivable::STATUS_PAID;
            $account->balance = 0;
        } else {
            $account->status = AccountReceivable::STATUS_PARTIAL;
        }

        $account->save();

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateClient($account->client_id, [
                'current_balance' => AccountReceivable::where('client_id', $account->client_id)
                    ->where('status', '!=', AccountReceivable::STATUS_PAID)
                    ->sum('balance'),
            ]);
        }

        return response()->json($account);
    }

    public function markPayablePaid(AccountPayable $account, Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
        ]);

        $account->paid_amount += $request->amount;
        $account->balance = $account->amount - $account->paid_amount;

        if ($account->balance <= 0) {
            $account->status = AccountPayable::STATUS_PAID;
            $account->balance = 0;
        } else {
            $account->status = AccountPayable::STATUS_PARTIAL;
        }

        $account->save();

        if ($this->firebase->isConfigured()) {
            $this->firebase->updateSupplier($account->supplier_id, [
                'outstanding_balance' => AccountPayable::where('supplier_id', $account->supplier_id)
                    ->where('status', '!=', AccountPayable::STATUS_PAID)
                    ->sum('balance'),
            ]);
        }

        return response()->json($account);
    }

    public function getReceivableSummary(): JsonResponse
    {
        $pending = AccountReceivable::where('status', AccountReceivable::STATUS_PENDING)->sum('balance');
        $paid = AccountReceivable::where('status', AccountReceivable::STATUS_PAID)->sum('amount');
        $overdue = AccountReceivable::where('status', AccountReceivable::STATUS_OVERDUE)->sum('balance');

        return response()->json([
            'pending' => $pending,
            'paid' => $paid,
            'overdue' => $overdue,
        ]);
    }

    public function getPayableSummary(): JsonResponse
    {
        $pending = AccountPayable::where('status', AccountPayable::STATUS_PENDING)->sum('balance');
        $paid = AccountPayable::where('status', AccountPayable::STATUS_PAID)->sum('amount');
        $overdue = AccountPayable::where('status', AccountPayable::STATUS_OVERDUE)->sum('balance');

        return response()->json([
            'pending' => $pending,
            'paid' => $paid,
            'overdue' => $overdue,
        ]);
    }
}

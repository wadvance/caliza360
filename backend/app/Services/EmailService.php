<?php

namespace App\Services;

use App\Models\Truck;
use App\Models\Trip;
use App\Models\Driver;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Inventory;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class EmailService
{
    /**
     * Send daily summary report
     */
    public function sendDailySummary(array $recipients): bool
    {
        $data = $this->getDailySummaryData();

        foreach ($recipients as $email) {
            Mail::to($email)->send(new \App\Mail\DailySummaryMail($data));
        }

        return true;
    }

    /**
     * Send weekly summary report
     */
    public function sendWeeklySummary(array $recipients): bool
    {
        $data = $this->getWeeklySummaryData();

        foreach ($recipients as $email) {
            Mail::to($email)->send(new \App\Mail\WeeklySummaryMail($data));
        }

        return true;
    }

    /**
     * Send inventory alerts
     */
    public function sendInventoryAlerts(array $recipients): bool
    {
        $lowStock = Inventory::where('quantity', '<=', 'min_stock')->get();

        if ($lowStock->isEmpty()) {
            return false;
        }

        foreach ($recipients as $email) {
            Mail::to($email)->send(new \App\Mail\InventoryAlertMail($lowStock));
        }

        return true;
    }

    /**
     * Send maintenance alerts
     */
    public function sendMaintenanceAlerts(array $recipients): bool
    {
        $aiService = new AIService();
        $predictions = $aiService->getFleetPredictions();
        $alerts = array_filter($predictions, fn($p) => $p['alert'] ?? false);

        if (empty($alerts)) {
            return false;
        }

        foreach ($recipients as $email) {
            Mail::to($email)->send(new \App\Mail\MaintenanceAlertMail(array_values($alerts)));
        }

        return true;
    }

    /**
     * Send overdue invoices alert
     */
    public function sendOverdueInvoiceAlerts(array $recipients): bool
    {
        $overdue = Invoice::where('status', 'overdue')
            ->orWhere(function ($query) {
                $query->where('status', 'sent')
                      ->where('due_date', '<', Carbon::now());
            })
            ->get();

        if ($overdue->isEmpty()) {
            return false;
        }

        foreach ($recipients as $email) {
            Mail::to($email)->send(new \App\Mail\OverdueInvoiceMail($overdue));
        }

        return true;
    }

    private function getDailySummaryData(): array
    {
        $today = Carbon::today();

        $tripsToday = Trip::whereDate('created_at', $today)->count();
        $tripsCompleted = Trip::whereDate('created_at', $today)->where('status', 'returned')->count();
        $tonsTransported = Trip::whereDate('created_at', $today)->sum('weight');
        $income = Invoice::where('type', 'sale')->whereDate('created_at', $today)->sum('total');
        $expenses = Invoice::where('type', 'purchase')->whereDate('created_at', $today)->sum('total');
        $activeTrucks = Truck::where('status', 'active')->count();
        $activeDrivers = Driver::where('status', 'active')->count();
        $tripsInProgress = Trip::where('status', 'in_transit')->count();

        return [
            'date' => $today->format('d/m/Y'),
            'trips_today' => $tripsToday,
            'trips_completed' => $tripsCompleted,
            'tons_transported' => $tonsTransported,
            'income' => $income,
            'expenses' => $expenses,
            'profit' => $income - $expenses,
            'active_trucks' => $activeTrucks,
            'active_drivers' => $activeDrivers,
            'trips_in_progress' => $tripsInProgress,
        ];
    }

    private function getWeeklySummaryData(): array
    {
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        $tripsThisWeek = Trip::whereBetween('created_at', [$startOfWeek, $endOfWeek])->count();
        $tonsThisWeek = Trip::whereBetween('created_at', [$startOfWeek, $endOfWeek])->sum('weight');
        $incomeThisWeek = Invoice::where('type', 'sale')->whereBetween('created_at', [$startOfWeek, $endOfWeek])->sum('total');
        $expensesThisWeek = Invoice::where('type', 'purchase')->whereBetween('created_at', [$startOfWeek, $endOfWeek])->sum('total');

        $dailyData = [];
        for ($i = 0; $i < 7; $i++) {
            $date = $startOfWeek->copy()->addDays($i);
            $dailyData[] = [
                'day' => $date->format('D'),
                'trips' => Trip::whereDate('created_at', $date)->count(),
                'tons' => Trip::whereDate('created_at', $date)->sum('weight'),
            ];
        }

        return [
            'period' => $startOfWeek->format('d/m') . ' - ' . $endOfWeek->format('d/m/Y'),
            'total_trips' => $tripsThisWeek,
            'total_tons' => $tonsThisWeek,
            'total_income' => $incomeThisWeek,
            'total_expenses' => $expensesThisWeek,
            'profit' => $incomeThisWeek - $expensesThisWeek,
            'daily_data' => $dailyData,
        ];
    }
}

<?php

namespace App\Console\Commands;

use App\Services\EmailService;
use Illuminate\Console\Command;

class SendAlerts extends Command
{
    protected $signature = 'reports:send-alerts';
    protected $description = 'Send alert emails (inventory, maintenance, overdue invoices)';

    public function handle()
    {
        $this->info('Checking and sending alerts...');

        $recipients = config('email_reports.recipients', []);
        $alertRecipients = $recipients['alerts'] ?? [];

        if (empty($alertRecipients)) {
            $this->warn('No alert recipients configured.');
            return 0;
        }

        $emailService = new EmailService();
        $sent = 0;

        try {
            if ($emailService->sendInventoryAlerts($alertRecipients)) {
                $this->info('Inventory alerts sent.');
                $sent++;
            }
        } catch (\Exception $e) {
            $this->error("Inventory alert error: " . $e->getMessage());
        }

        try {
            if ($emailService->sendMaintenanceAlerts($alertRecipients)) {
                $this->info('Maintenance alerts sent.');
                $sent++;
            }
        } catch (\Exception $e) {
            $this->error("Maintenance alert error: " . $e->getMessage());
        }

        try {
            if ($emailService->sendOverdueInvoiceAlerts($alertRecipients)) {
                $this->info('Overdue invoice alerts sent.');
                $sent++;
            }
        } catch (\Exception $e) {
            $this->error("Overdue invoice alert error: " . $e->getMessage());
        }

        if ($sent === 0) {
            $this->info('No alerts to send.');
        }

        return 0;
    }
}

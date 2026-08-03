<?php

namespace App\Console\Commands;

use App\Services\EmailService;
use Illuminate\Console\Command;

class SendDailyReports extends Command
{
    protected $signature = 'reports:send-daily';
    protected $description = 'Send daily summary reports to configured recipients';

    public function handle()
    {
        $this->info('Sending daily reports...');

        $recipients = config('email_reports.recipients', []);
        $dailyRecipients = $recipients['daily'] ?? [];

        if (empty($dailyRecipients)) {
            $this->warn('No daily report recipients configured.');
            return 0;
        }

        try {
            $emailService = new EmailService();
            $emailService->sendDailySummary($dailyRecipients);
            $this->info("Daily reports sent to " . count($dailyRecipients) . " recipients.");
        } catch (\Exception $e) {
            $this->error("Failed to send daily reports: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}

<?php

namespace App\Console\Commands;

use App\Services\EmailService;
use Illuminate\Console\Command;

class SendWeeklyReports extends Command
{
    protected $signature = 'reports:send-weekly';
    protected $description = 'Send weekly summary reports to configured recipients';

    public function handle()
    {
        $this->info('Sending weekly reports...');

        $recipients = config('email_reports.recipients', []);
        $weeklyRecipients = $recipients['weekly'] ?? [];

        if (empty($weeklyRecipients)) {
            $this->warn('No weekly report recipients configured.');
            return 0;
        }

        try {
            $emailService = new EmailService();
            $emailService->sendWeeklySummary($weeklyRecipients);
            $this->info("Weekly reports sent to " . count($weeklyRecipients) . " recipients.");
        } catch (\Exception $e) {
            $this->error("Failed to send weekly reports: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}

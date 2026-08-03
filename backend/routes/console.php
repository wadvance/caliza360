<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule daily reports at 7:00 AM
Schedule::command('reports:send-daily')->dailyAt('07:00');

// Schedule weekly reports on Monday at 8:00 AM
Schedule::command('reports:send-weekly')->weekly()->mondays()->at('08:00');

// Schedule alerts check at 9:00 AM daily
Schedule::command('reports:send-alerts')->dailyAt('09:00');

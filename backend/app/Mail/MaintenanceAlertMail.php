<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MaintenanceAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $alerts;

    public function __construct(array $alerts)
    {
        $this->alerts = $alerts;
    }

    public function build()
    {
        return $this->subject('Alerta: Mantenimiento Pendiente - Caliza Los Osos')
                    ->view('emails.maintenance-alert')
                    ->with(['alerts' => $this->alerts]);
    }
}

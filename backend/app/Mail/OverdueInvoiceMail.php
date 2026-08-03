<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class OverdueInvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public Collection $invoices;

    public function __construct(Collection $invoices)
    {
        $this->invoices = $invoices;
    }

    public function build()
    {
        return $this->subject('Alerta: Facturas Vencidas - Caliza Los Osos')
                    ->view('emails.overdue-invoice')
                    ->with(['invoices' => $this->invoices]);
    }
}

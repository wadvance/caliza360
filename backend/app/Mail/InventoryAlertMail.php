<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class InventoryAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public Collection $lowStockItems;

    public function __construct(Collection $lowStockItems)
    {
        $this->lowStockItems = $lowStockItems;
    }

    public function build()
    {
        return $this->subject('Alerta: Stock Bajo en Inventario - Caliza Los Osos')
                    ->view('emails.inventory-alert')
                    ->with(['items' => $this->lowStockItems]);
    }
}

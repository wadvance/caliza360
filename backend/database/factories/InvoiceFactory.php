<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Invoice;
use App\Models\Client;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $subtotal = fake()->randomFloat(2, 1000, 100000);
        $iva = $subtotal * 0.16;

        return [
            'invoice_number' => 'FAC-' . fake()->numerify('######'),
            'type' => fake()->randomElement(['sale', 'purchase']),
            'client_id' => Client::factory(),
            'items' => [
                ['description' => 'Caliza', 'quantity' => fake()->numberBetween(10, 100), 'unit_price' => fake()->randomFloat(2, 200, 500)],
            ],
            'subtotal' => $subtotal,
            'iva' => $iva,
            'total' => $subtotal + $iva,
            'issue_date' => fake()->dateTimeBetween('-3 months', 'now'),
            'due_date' => fake()->dateTimeBetween('now', '+3 months'),
            'status' => fake()->randomElement(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
            'payment_method' => fake()->randomElement(['cash', 'transfer', 'check', null]),
        ];
    }
}

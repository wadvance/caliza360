<?php

namespace Database\Factories;

use App\Models\Driver;
use App\Models\ExtraPayment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExtraPaymentFactory extends Factory
{
    protected $model = ExtraPayment::class;

    public function definition(): array
    {
        return [
            'driver_id' => Driver::factory(),
            'payroll_id' => null,
            'concept' => fake()->randomElement(['Bono de producción', 'Horas extra', 'Apoyo transporte', 'Bono puntualidad', 'Premio por rendimiento']),
            'description' => fake()->sentence(),
            'amount' => fake()->randomFloat(2, 50, 2000),
            'payment_date' => now(),
            'status' => fake()->randomElement(ExtraPayment::STATUSES),
            'created_by' => User::factory(),
        ];
    }
}

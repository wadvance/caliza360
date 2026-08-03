<?php

namespace Database\Factories;

use App\Models\SupervisorReception;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupervisorReceptionFactory extends Factory
{
    protected $model = SupervisorReception::class;

    public function definition(): array
    {
        return [
            'stage' => fake()->randomElement(['recepcion', 'chancado_primario', 'chancado_secundario']),
            'material' => fake()->randomElement(['Caliza cruda', 'Caliza chancada 0-10 cm', 'Caliza chancada 0-5 cm']),
            'tonnage' => fake()->randomFloat(2, 50, 400),
            'processed_date' => now()->toDateString(),
            'origin' => fake()->randomElement(['Cantera norte', 'Cantera sur']),
            'notes' => null,
            'status' => SupervisorReception::STATUS_RECIBIDO,
            'created_by' => null,
        ];
    }
}

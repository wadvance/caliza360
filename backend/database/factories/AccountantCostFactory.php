<?php

namespace Database\Factories;

use App\Models\AccountantCost;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccountantCostFactory extends Factory
{
    protected $model = AccountantCost::class;

    public function definition(): array
    {
        return [
            'category' => fake()->randomElement(['electricidad', 'combustible', 'maquinaria', 'explosivos', 'personal', 'mantenimiento', 'otros']),
            'description' => fake()->sentence(5),
            'amount' => fake()->randomFloat(2, 500, 30000),
            'tonnage' => fake()->randomFloat(2, 50, 400),
            'unit_cost' => null,
            'cost_date' => now()->toDateString(),
            'notes' => null,
            'status' => AccountantCost::STATUS_REGISTRADO,
            'created_by' => null,
        ];
    }
}

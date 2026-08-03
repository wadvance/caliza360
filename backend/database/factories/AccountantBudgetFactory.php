<?php

namespace Database\Factories;

use App\Models\AccountantBudget;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccountantBudgetFactory extends Factory
{
    protected $model = AccountantBudget::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'budget_type' => fake()->randomElement(['capex', 'opex']),
            'category' => fake()->randomElement(['proceso', 'personal', 'combustible', 'energia', 'mantenimiento', 'proyecto', 'otro']),
            'planned_amount' => fake()->randomFloat(2, 5000, 200000),
            'actual_amount' => fake()->randomFloat(2, 0, 150000),
            'period' => date('Y-m'),
            'notes' => null,
            'status' => AccountantBudget::STATUS_BORRADOR,
            'created_by' => null,
        ];
    }
}

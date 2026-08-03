<?php

namespace Database\Factories;

use App\Models\AccountantCompliance;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccountantComplianceFactory extends Factory
{
    protected $model = AccountantCompliance::class;

    public function definition(): array
    {
        return [
            'type' => fake()->randomElement(AccountantCompliance::TYPES),
            'title' => fake()->sentence(4),
            'amount' => fake()->randomFloat(2, 1000, 100000),
            'due_date' => fake()->dateTimeBetween('now', '+1 year'),
            'paid_date' => null,
            'notes' => null,
            'status' => AccountantCompliance::STATUS_PENDIENTE,
            'created_by' => null,
        ];
    }
}

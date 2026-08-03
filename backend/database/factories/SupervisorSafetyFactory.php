<?php

namespace Database\Factories;

use App\Models\SupervisorSafety;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupervisorSafetyFactory extends Factory
{
    protected $model = SupervisorSafety::class;

    public function definition(): array
    {
        return [
            'type' => fake()->randomElement(SupervisorSafety::TYPES),
            'title' => fake()->sentence(4),
            'description' => fake()->sentence(),
            'risk_level' => fake()->randomElement(['bajo', 'medio', 'alto', 'critico']),
            'status' => SupervisorSafety::STATUS_PENDIENTE,
            'checked_date' => now()->toDateString(),
            'action_plan' => null,
            'created_by' => null,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\SupervisorTask;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupervisorTaskFactory extends Factory
{
    protected $model = SupervisorTask::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'assignee' => fake()->name(),
            'priority' => fake()->randomElement(['alta', 'media', 'baja']),
            'due_date' => fake()->date(),
            'notes' => null,
            'status' => SupervisorTask::STATUS_PENDIENTE,
            'assigned_by' => null,
        ];
    }
}

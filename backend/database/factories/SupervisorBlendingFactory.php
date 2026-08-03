<?php

namespace Database\Factories;

use App\Models\SupervisorBlending;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupervisorBlendingFactory extends Factory
{
    protected $model = SupervisorBlending::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'materials' => 'Caliza, arcilla y arena',
            'target_spec' => fake()->randomFloat(2, 50, 95),
            'blend_date' => now()->toDateString(),
            'notes' => null,
            'status' => SupervisorBlending::STATUS_PLANIFICADO,
            'created_by' => null,
        ];
    }
}

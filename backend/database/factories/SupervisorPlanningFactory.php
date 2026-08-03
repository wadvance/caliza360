<?php

namespace Database\Factories;

use App\Models\SupervisorPlanning;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupervisorPlanningFactory extends Factory
{
    protected $model = SupervisorPlanning::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(4),
            'activity_type' => fake()->randomElement(['extraccion', 'procesamiento', 'chancado', 'mezclado', 'mantenimiento', 'otro']),
            'planned_date' => now()->toDateString(),
            'start_time' => fake()->time('H:i'),
            'end_time' => fake()->time('H:i'),
            'area' => fake()->randomElement(['Cantera norte', 'Cantera sur', 'Planta de trituración', 'Zona de mezclado']),
            'assigned_person' => fake()->name(),
            'notes' => null,
            'status' => SupervisorPlanning::STATUS_PLANIFICADO,
            'created_by' => null,
        ];
    }
}

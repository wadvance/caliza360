<?php

namespace Database\Factories;

use App\Models\SupervisorQuality;
use Illuminate\Database\Eloquent\Factories\Factory;

class SupervisorQualityFactory extends Factory
{
    protected $model = SupervisorQuality::class;

    public function definition(): array
    {
        return [
            'material' => fake()->randomElement(['Caliza agrícola', 'Caliza construcción', 'Caliza química']),
            'purity' => fake()->randomFloat(2, 80, 98),
            'granulometry' => fake()->randomElement(['0-2 mm', '2-5 mm', '5-10 mm']),
            'industry' => fake()->randomElement(['agricultura', 'construccion', 'quimica']),
            'checked_date' => now()->toDateString(),
            'notes' => null,
            'status' => SupervisorQuality::STATUS_PENDIENTE,
            'created_by' => null,
        ];
    }
}

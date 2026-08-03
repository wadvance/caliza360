<?php

namespace Database\Factories;

use App\Models\PettyCash;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PettyCashFactory extends Factory
{
    protected $model = PettyCash::class;

    public function definition(): array
    {
        return [
            'date' => now(),
            'concept' => fake()->sentence(3),
            'type' => fake()->randomElement(PettyCash::TYPES),
            'amount' => fake()->randomFloat(2, 5, 500),
            'category' => fake()->randomElement(PettyCash::CATEGORIES),
            'responsible_person' => fake()->name(),
            'reference' => null,
            'notes' => null,
            'created_by' => User::factory(),
        ];
    }
}

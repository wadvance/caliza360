<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Supplier;

class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'company' => fake()->company(),
            'rfc' => strtoupper(fake()->bothify('??##?????##?')),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'material_type' => fake()->randomElement(['Combustible', 'Llantas', 'Refacciones', 'Caliza']),
            'rating' => fake()->randomFloat(1, 1, 5),
        ];
    }
}
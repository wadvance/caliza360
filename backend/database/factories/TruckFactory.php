<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Truck;

class TruckFactory extends Factory
{
    protected $model = Truck::class;

    public function definition(): array
    {
        return [
            'plate' => strtoupper(substr(sha1(fake()->uuid()), 0, 3) . '-' . fake()->numerify('####')),
            'brand' => fake()->randomElement(['Kenworth', 'Freightliner', 'Peterbilt', 'Volvo', 'Scania']),
            'model' => fake()->randomElement(['T800', 'W900', 'Cascadia', '389', 'FH16']),
            'year' => fake()->numberBetween(2015, 2024),
            'color' => fake()->safeColorName(),
            'capacity' => fake()->randomFloat(1, 20, 40),
            'current_mileage' => fake()->numberBetween(10000, 200000),
            'status' => fake()->randomElement(['active', 'maintenance', 'inactive']),
        ];
    }
}

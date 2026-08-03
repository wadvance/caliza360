<?php

namespace Database\Factories;

use App\Models\Truck;
use Illuminate\Database\Eloquent\Factories\Factory;

class TireFactory extends Factory
{
    public function definition(): array
    {
        return [
            'truck_id' => Truck::factory(),
            'position' => $this->faker->randomElement(['Delantera Izq.', 'Delantera Der.', 'Trasera Izq.', 'Trasera Der.']),
            'brand' => $this->faker->randomElement(['Michelin', 'Goodyear', 'Bridgestone', 'Continental']),
            'model' => $this->faker->bothify('XZ####'),
            'serial_number' => strtoupper($this->faker->bothify('??####??')),
            'install_date' => $this->faker->date(),
            'current_mileage' => $this->faker->numberBetween(0, 80000),
            'max_mileage' => 100000,
            'pressure' => $this->faker->randomFloat(1, 80, 110),
            'status' => $this->faker->randomElement(['good', 'worn', 'needs_replacement']),
        ];
    }
}
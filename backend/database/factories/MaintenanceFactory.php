<?php

namespace Database\Factories;

use App\Models\Truck;
use Illuminate\Database\Eloquent\Factories\Factory;

class MaintenanceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'truck_id' => Truck::factory(),
            'type' => $this->faker->randomElement(['preventive', 'corrective', 'emergency']),
            'description' => $this->faker->sentence(),
            'service_date' => $this->faker->date(),
            'mileage_at_service' => $this->faker->numberBetween(1000, 200000),
            'cost' => $this->faker->randomFloat(2, 50, 5000),
            'status' => 'completed',
            'next_mileage' => $this->faker->numberBetween(5000, 50000),
        ];
    }
}
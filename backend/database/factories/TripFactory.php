<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Trip;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Client;

class TripFactory extends Factory
{
    protected $model = Trip::class;

    public function definition(): array
    {
        return [
            'truck_id' => Truck::factory(),
            'driver_id' => Driver::factory(),
            'client_id' => Client::factory(),
            'origin_name' => fake()->randomElement(['Cantera Norte', 'Cantera Sur', 'Cantera Centro']),
            'origin_address' => fake()->address(),
            'destination_name' => fake()->randomElement(['Centro', 'Zona Norte', 'Zona Sur', 'Zona Industrial']),
            'destination_address' => fake()->address(),
            'material_type' => fake()->randomElement(['Caliza', 'Arena', 'Grava', 'Sascalilla']),
            'weight' => fake()->randomFloat(1, 10, 35),
            'price_per_ton' => fake()->randomFloat(2, 250, 400),
            'total_amount' => fake()->randomFloat(2, 5000, 50000),
            'scheduled_date' => fake()->dateTimeBetween('-1 month', '+1 month'),
            'scheduled_time' => fake()->time('H:i'),
            'status' => fake()->randomElement(['scheduled', 'in_transit', 'delivered', 'returned', 'cancelled']),
            'start_mileage' => fake()->optional(0.7)->randomFloat(0, 10000, 200000),
            'end_mileage' => fake()->optional(0.5)->randomFloat(0, 10000, 200000),
            'fuel_cost' => fake()->optional()->randomFloat(2, 50, 500),
            'tolls_cost' => fake()->optional()->randomFloat(2, 0, 200),
            'maintenance_cost' => fake()->optional()->randomFloat(2, 0, 100),
            'other_cost' => fake()->optional()->randomFloat(2, 0, 50),
        ];
    }
}

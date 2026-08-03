<?php

namespace Database\Factories;

use App\Models\Dispatch;
use App\Models\Driver;
use App\Models\Truck;
use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

class DispatchFactory extends Factory
{
    protected $model = Dispatch::class;

    public function definition(): array
    {
        return [
            'dispatch_number' => 'DS-' . fake()->unique()->numerify('#########'),
            'date' => fake()->date(),
            'truck_id' => Truck::factory(),
            'driver_id' => Driver::factory(),
            'client_id' => null,
            'destination_name' => fake()->randomElement([
                'Empresas Melo',
                'Cementos Panamá',
                'Concretos del Istmo',
                'Planta de Producción',
            ]),
            'material_type' => 'Caliza',
            'planned_tons' => fake()->randomFloat(2, 15, 45),
            'actual_tons' => fake()->randomFloat(2, 15, 45),
            'sack_count' => fake()->numberBetween(10, 200),
            'departure_datetime' => now()->setTime(8, 0),
            'delivery_datetime' => null,
            'status' => Dispatch::STATUS_SCHEDULED,
            'responsible_person' => fake()->name(),
            'notes' => null,
            'created_by' => null,
        ];
    }
}

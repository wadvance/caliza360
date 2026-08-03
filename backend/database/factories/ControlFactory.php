<?php

namespace Database\Factories;

use App\Models\Control;
use App\Models\Driver;
use App\Models\Truck;
use Illuminate\Database\Eloquent\Factories\Factory;

class ControlFactory extends Factory
{
    protected $model = Control::class;

    public function definition(): array
    {
        return [
            'control_number' => 'CT-' . fake()->unique()->numerify('#########'),
            'date' => now(),
            'location' => fake()->randomElement([Control::LOCATION_CANTERA, Control::LOCATION_PLANTA]),
            'control_type' => fake()->randomElement([Control::TYPE_ENTRADA, Control::TYPE_SALIDA]),
            'truck_id' => Truck::factory(),
            'driver_id' => Driver::factory(),
            'proforma_id' => null,
            'dispatch_id' => null,
            'weight_tons' => fake()->randomFloat(2, 15, 45),
            'sack_count' => fake()->numberBetween(10, 200),
            'responsible_person' => fake()->name(),
            'notes' => null,
            'created_by' => null,
        ];
    }
}

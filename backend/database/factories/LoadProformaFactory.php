<?php

namespace Database\Factories;

use App\Models\LoadProforma;
use App\Models\Driver;
use App\Models\Truck;
use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

class LoadProformaFactory extends Factory
{
    protected $model = LoadProforma::class;

    public function definition(): array
    {
        return [
            'proforma_number' => 'PF-' . fake()->unique()->numerify('#########'),
            'date' => fake()->date(),
            'truck_id' => Truck::factory(),
            'driver_id' => Driver::factory(),
            'client_id' => null,
            'origin_quarry' => fake()->randomElement(['Cantera Principal', 'Cantera Cerro Azul', 'Cantera Los Santos']),
            'destination_name' => fake()->randomElement([
                'Planta de Producción',
                'Empresas Melo',
                'Cementos Panamá',
                'Concretos del Istmo',
            ]),
            'material_type' => 'Caliza',
            'weight_tons' => fake()->randomFloat(2, 15, 45),
            'sack_count' => fake()->numberBetween(10, 200),
            'gross_weight' => null,
            'tare_weight' => null,
            'net_weight' => null,
            'unit_price' => null,
            'total_amount' => null,
            'status' => LoadProforma::STATUS_CREATED,
            'notes' => null,
            'created_by' => null,
        ];
    }
}

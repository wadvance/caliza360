<?php

namespace Database\Factories;

use App\Models\AccountantAsset;
use Illuminate\Database\Eloquent\Factories\Factory;

class AccountantAssetFactory extends Factory
{
    protected $model = AccountantAsset::class;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Chancadora primaria', 'Horno calero rotativo', 'Concesión minera', 'Volquete de 12 m³']),
            'type' => fake()->randomElement(['maquinaria', 'horno_calero', 'concesion_minera', 'vehiculo', 'instalacion', 'otro']),
            'acquisition_value' => fake()->randomFloat(2, 50000, 1500000),
            'acquisition_date' => now()->subYears(fake()->numberBetween(1, 10)),
            'useful_life_years' => fake()->randomFloat(1, 5, 25),
            'salvage_value' => fake()->randomFloat(2, 0, 100000),
            'accumulated_depreciation' => fake()->randomFloat(2, 0, 300000),
            'notes' => null,
            'status' => AccountantAsset::STATUS_ACTIVO,
            'created_by' => null,
        ];
    }
}

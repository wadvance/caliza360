<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Client;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'rfc' => strtoupper(substr(sha1(fake()->uuid()), 0, 4) . fake()->numerify('######')),
            'balance' => fake()->randomFloat(2, 0, 100000),
        ];
    }
}

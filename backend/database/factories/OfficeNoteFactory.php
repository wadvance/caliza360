<?php

namespace Database\Factories;

use App\Models\OfficeNote;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OfficeNoteFactory extends Factory
{
    protected $model = OfficeNote::class;

    public function definition(): array
    {
        return [
            'note_number' => 'NT-' . fake()->unique()->numerify('#########'),
            'title' => fake()->sentence(5),
            'body' => fake()->paragraphs(2, true),
            'note_type' => fake()->randomElement(OfficeNote::TYPES),
            'note_date' => now(),
            'status' => fake()->randomElement(OfficeNote::STATUSES),
            'related_to' => null,
            'created_by' => User::factory(),
            'updated_by' => null,
        ];
    }
}

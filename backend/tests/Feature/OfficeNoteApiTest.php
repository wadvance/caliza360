<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\OfficeNote;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OfficeNoteApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->token = $this->admin->createToken('auth-token')->plainTextToken;
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_secretary_can_access_notes(): void
    {
        $secretary = User::factory()->create(['role' => 'secretary']);
        $token = $secretary->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->getJson('/api/notes')
             ->assertStatus(200);
    }

    public function test_create_note_generates_number(): void
    {
        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/notes', [
                             'title' => 'Memorando para planta',
                             'body' => 'Se solicita ajustar los turnos de carga la próxima semana.',
                             'note_type' => 'memorando',
                             'note_date' => now()->toDateString(),
                             'status' => 'final',
                             'related_to' => 'Planta de Producción',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('title', 'Memorando para planta')
                 ->assertJsonStructure(['note_number', 'id']);

        $this->assertStringStartsWith('NT-', $response->json('note_number'));
        $this->assertDatabaseHas('office_notes', ['related_to' => 'Planta de Producción']);
    }

    public function test_summary_counts_by_status(): void
    {
        OfficeNote::factory()->count(3)->create(['status' => 'final']);
        OfficeNote::factory()->count(2)->create(['status' => 'draft']);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/notes/summary');

        $response->assertStatus(200)
                 ->assertJsonPath('total_notes', 5)
                 ->assertJsonPath('total_final', 3)
                 ->assertJsonPath('total_draft', 2);
    }

    public function test_update_and_delete_note(): void
    {
        $note = OfficeNote::factory()->create();

        $this->withHeaders($this->authHeaders())
             ->putJson("/api/notes/{$note->id}", [
                 'title' => 'Nota actualizada',
                 'body' => 'Contenido nuevo',
                 'note_type' => 'general',
                 'note_date' => $note->note_date->toDateString(),
                 'status' => 'final',
             ])
             ->assertStatus(200)
             ->assertJsonPath('title', 'Nota actualizada');

        $this->withHeaders($this->authHeaders())
             ->deleteJson("/api/notes/{$note->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('office_notes', ['id' => $note->id]);
    }

    public function test_driver_cannot_access_notes(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $token = $driver->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->getJson('/api/notes')
             ->assertStatus(403);
    }
}

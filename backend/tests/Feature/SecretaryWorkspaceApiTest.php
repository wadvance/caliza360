<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\SecretaryAgenda;
use App\Models\SecretaryReception;
use App\Models\SecretaryDocument;
use App\Models\SecretaryLogistic;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SecretaryWorkspaceApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $secretary;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->secretary = User::factory()->create(['role' => 'secretary']);
        $this->token = $this->secretary->createToken('auth-token')->plainTextToken;
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_secretary_screens_do_not_include_clients_nor_reports(): void
    {
        $screens = $this->secretary->allowedScreens();

        $this->assertContains('dashboard', $screens);
        $this->assertContains('notes', $screens);
        $this->assertContains('whatsapp', $screens);
        $this->assertContains('secretary-workspace', $screens);
        $this->assertNotContains('clients', $screens);
        $this->assertNotContains('reports', $screens);
    }

    public function test_secretary_can_create_agenda_event(): void
    {
        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/secretary/agenda', [
                             'title' => 'Reunión semanal',
                             'event_type' => 'reunion',
                             'mode' => 'virtual',
                             'starts_at' => now()->tomorrow()->setTime(9, 0),
                             'ends_at' => now()->tomorrow()->setTime(10, 0),
                             'participants' => 'Gerencia',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('title', 'Reunión semanal')
                 ->assertJsonPath('event_type', 'reunion');

        $this->assertDatabaseHas('secretary_agenda', ['title' => 'Reunión semanal']);
    }

    public function test_agenda_detects_overlap(): void
    {
        SecretaryAgenda::create([
            'title' => 'Evento existente',
            'event_type' => 'reunion',
            'mode' => 'presencial',
            'starts_at' => now()->tomorrow()->setTime(9, 0),
            'ends_at' => now()->tomorrow()->setTime(10, 0),
            'status' => 'confirmada',
            'created_by' => $this->secretary->id,
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/secretary/agenda', [
                             'title' => 'Evento que se superpone',
                             'event_type' => 'cita',
                             'mode' => 'presencial',
                             'starts_at' => now()->tomorrow()->setTime(9, 30),
                             'ends_at' => now()->tomorrow()->setTime(10, 30),
                         ]);

        $response->assertStatus(422);
    }

    public function test_agenda_allows_adjacent_events(): void
    {
        SecretaryAgenda::create([
            'title' => 'Evento existente',
            'event_type' => 'reunion',
            'mode' => 'presencial',
            'starts_at' => now()->tomorrow()->setTime(9, 0),
            'ends_at' => now()->tomorrow()->setTime(10, 0),
            'status' => 'confirmada',
            'created_by' => $this->secretary->id,
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/secretary/agenda', [
                             'title' => 'Evento posterior',
                             'event_type' => 'cita',
                             'mode' => 'virtual',
                             'starts_at' => now()->tomorrow()->setTime(10, 0),
                             'ends_at' => now()->tomorrow()->setTime(11, 0),
                         ]);

        $response->assertStatus(201);
    }

    public function test_agenda_update_and_delete(): void
    {
        $event = SecretaryAgenda::create([
            'title' => 'Evento inicial',
            'event_type' => 'cita',
            'mode' => 'presencial',
            'starts_at' => now()->tomorrow()->setTime(14, 0),
            'ends_at' => now()->tomorrow()->setTime(15, 0),
            'status' => 'pendiente',
            'created_by' => $this->secretary->id,
        ]);

        $this->withHeaders($this->authHeaders())
             ->putJson("/api/secretary/agenda/{$event->id}", [
                 'title' => 'Evento actualizado',
                 'event_type' => 'cita',
                 'mode' => 'virtual',
                 'starts_at' => now()->tomorrow()->setTime(14, 0),
                 'ends_at' => now()->tomorrow()->setTime(15, 0),
                 'status' => 'confirmada',
             ])
             ->assertStatus(200)
             ->assertJsonPath('title', 'Evento actualizado');

        $this->withHeaders($this->authHeaders())
             ->deleteJson("/api/secretary/agenda/{$event->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('secretary_agenda', ['id' => $event->id]);
    }

    public function test_secretary_can_register_reception(): void
    {
        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/secretary/reception', [
                             'type' => 'llamada',
                             'person_name' => 'María López',
                             'company' => 'Cemento Panamá',
                             'subject' => 'Consulta de caliza',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('person_name', 'María López');

        $this->assertDatabaseHas('secretary_reception', ['person_name' => 'María López']);
    }

    public function test_secretary_can_archive_document(): void
    {
        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/secretary/documents', [
                             'title' => 'Contrato anual',
                             'category' => 'Contratos',
                             'format' => 'fisico',
                             'location' => 'Archivo principal',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('format', 'fisico');

        $this->assertDatabaseHas('secretary_documents', ['title' => 'Contrato anual']);
    }

    public function test_secretary_can_manage_logistics(): void
    {
        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/secretary/logistics', [
                             'type' => 'sala',
                             'title' => 'Preparar sala de juntas',
                             'status' => 'pendiente',
                         ]);

        $response->assertStatus(201);

        $this->withHeaders($this->authHeaders())
             ->putJson("/api/secretary/logistics/{$response->json('id')}", [
                 'type' => 'sala',
                 'title' => 'Preparar sala de juntas',
                 'status' => 'completado',
             ])
             ->assertStatus(200)
             ->assertJsonPath('status', 'completado');
    }

    public function test_summary_returns_counts(): void
    {
        SecretaryAgenda::create([
            'title' => 'Reunión',
            'event_type' => 'reunion',
            'mode' => 'presencial',
            'starts_at' => now()->tomorrow()->setTime(9, 0),
            'ends_at' => now()->tomorrow()->setTime(10, 0),
            'status' => 'confirmada',
            'created_by' => $this->secretary->id,
        ]);

        $this->withHeaders($this->authHeaders())
             ->getJson('/api/secretary/summary')
             ->assertStatus(200)
             ->assertJsonStructure(['agenda', 'reception', 'documents', 'logistics', 'whatsapp', 'notes', 'petty_cash']);
    }

    public function test_admin_cannot_access_secretary_workspace(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->getJson('/api/secretary/summary')
             ->assertStatus(403);
    }
}

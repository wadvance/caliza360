<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\SupervisorPlanning;
use App\Models\PlantPersonnel;
use App\Models\SupervisorReception;
use App\Models\SupervisorBlending;
use App\Models\SupervisorQuality;
use App\Models\SupervisorSafety;
use App\Models\SupervisorTask;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SupervisorWorkspaceApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $supervisor;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->supervisor = User::factory()->create(['role' => 'supervisor']);
        $this->token = $this->supervisor->createToken('auth-token')->plainTextToken;
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_supervisor_screens_include_workspace_but_not_removed_modules(): void
    {
        $screens = $this->supervisor->allowedScreens();

        $this->assertContains('dashboard', $screens);
        $this->assertContains('controls', $screens);
        $this->assertContains('supervisor-workspace', $screens);
        $this->assertNotContains('clients', $screens);
        $this->assertNotContains('inventory', $screens);
        $this->assertNotContains('reports', $screens);
        $this->assertNotContains('proformas', $screens);
        $this->assertNotContains('notes', $screens);
    }

    public function test_supervisor_can_create_planning_activity(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/supervisor/planning', [
                'title' => 'Extracción en cantera norte',
                'activity_type' => 'extraccion',
                'planned_date' => now()->toDateString(),
                'start_time' => '07:00',
                'end_time' => '12:00',
                'area' => 'Cantera norte',
                'assigned_person' => 'Equipo de extracción',
                'status' => 'en_proceso',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'Extracción en cantera norte')
            ->assertJsonPath('created_by', $this->supervisor->id);

        $this->assertDatabaseHas('supervisor_planning', ['title' => 'Extracción en cantera norte']);
    }

    public function test_supervisor_can_update_and_delete_planning_activity(): void
    {
        $item = SupervisorPlanning::factory()->create(['created_by' => $this->supervisor->id]);

        $this->withHeaders($this->authHeaders())
            ->putJson("/api/supervisor/planning/{$item->id}", [
                'title' => 'Actividad reprogramada',
                'activity_type' => 'procesamiento',
                'planned_date' => now()->addDay()->toDateString(),
                'status' => 'completado',
            ])
            ->assertStatus(200)
            ->assertJsonPath('title', 'Actividad reprogramada');

        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/supervisor/planning/{$item->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('supervisor_planning', ['id' => $item->id]);
    }

    public function test_supervisor_can_register_reception(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/supervisor/reception', [
                'stage' => 'chancado_primario',
                'material' => 'Caliza chancada 0-10 cm',
                'tonnage' => 250.5,
                'processed_date' => now()->toDateString(),
                'origin' => 'Chancadora primaria',
                'status' => 'en_proceso',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('material', 'Caliza chancada 0-10 cm');

        $this->assertDatabaseHas('supervisor_reception', ['material' => 'Caliza chancada 0-10 cm']);
    }

    public function test_supervisor_can_manage_blending(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/supervisor/blending', [
                'title' => 'Mezcla para cemento portland',
                'materials' => 'Caliza, arcilla y arena',
                'target_spec' => 76.5,
                'blend_date' => now()->toDateString(),
                'status' => 'en_proceso',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'Mezcla para cemento portland');

        $id = $response->json('id');
        $this->withHeaders($this->authHeaders())
            ->putJson("/api/supervisor/blending/{$id}", [
                'title' => 'Mezcla actualizada',
                'materials' => 'Caliza, arcilla y arena',
                'blend_date' => now()->toDateString(),
                'status' => 'completado',
            ])
            ->assertStatus(200)
            ->assertJsonPath('title', 'Mezcla actualizada');

        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/supervisor/blending/{$id}")
            ->assertStatus(200);
    }

    public function test_supervisor_can_register_quality_control(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/supervisor/quality', [
                'material' => 'Caliza agrícola',
                'purity' => 92.4,
                'granulometry' => '0-2 mm',
                'industry' => 'agricultura',
                'checked_date' => now()->toDateString(),
                'status' => 'cumple',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'cumple');

        $this->assertDatabaseHas('supervisor_quality', ['material' => 'Caliza agrícola']);
    }

    public function test_supervisor_can_manage_safety_records(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/supervisor/safety', [
                'type' => 'control_riesgo',
                'title' => 'Control de polución en planta',
                'description' => 'Alta concentración de polvo.',
                'risk_level' => 'alto',
                'status' => 'en_atencion',
                'checked_date' => now()->toDateString(),
                'action_plan' => 'Activar sistema de aspersión.',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('risk_level', 'alto');

        $this->assertDatabaseHas('supervisor_safety', ['title' => 'Control de polución en planta']);
    }

    public function test_supervisor_can_assign_tasks(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/supervisor/tasks', [
                'title' => 'Inspección de chancadora secundaria',
                'assignee' => 'Técnico de planta',
                'priority' => 'alta',
                'due_date' => now()->addDay()->toDateString(),
                'status' => 'en_proceso',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('priority', 'alta')
            ->assertJsonPath('assigned_by', $this->supervisor->id);

        $this->assertDatabaseHas('supervisor_tasks', ['title' => 'Inspección de chancadora secundaria']);
    }

    public function test_supervisor_summary_has_expected_structure(): void
    {
        SupervisorPlanning::factory()->create([
            'planned_date' => now()->toDateString(),
            'status' => 'en_proceso',
            'created_by' => $this->supervisor->id,
        ]);
        SupervisorReception::factory()->create([
            'processed_date' => now()->toDateString(),
            'tonnage' => 150,
            'status' => 'completado',
            'created_by' => $this->supervisor->id,
        ]);
        SupervisorQuality::factory()->create([
            'checked_date' => now()->toDateString(),
            'status' => 'no_cumple',
            'created_by' => $this->supervisor->id,
        ]);
        SupervisorSafety::factory()->create([
            'risk_level' => 'alto',
            'status' => 'en_atencion',
            'checked_date' => now()->toDateString(),
            'created_by' => $this->supervisor->id,
        ]);
        SupervisorTask::factory()->create([
            'priority' => 'alta',
            'status' => 'pendiente',
            'assigned_by' => $this->supervisor->id,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/supervisor/summary')
            ->assertOk();

        $response->assertJsonStructure([
            'production' => ['planned_today', 'reception_today', 'tonnage_month', 'blending_month'],
            'quality' => ['checked_month', 'non_compliant'],
            'safety' => ['open', 'verified', 'high_risk'],
            'team' => ['pending_tasks', 'completed_tasks', 'high_priority'],
        ]);

        $this->assertEquals(1, $response->json('production.planned_today'));
        $this->assertEquals(150, $response->json('production.tonnage_month'));
        $this->assertEquals(1, $response->json('quality.non_compliant'));
        $this->assertEquals(1, $response->json('safety.high_risk'));
        $this->assertEquals(1, $response->json('team.pending_tasks'));
        $this->assertEquals(1, $response->json('team.high_priority'));
    }

    public function test_admin_cannot_access_supervisor_workspace(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $adminToken = $admin->createToken('auth-token')->plainTextToken;

        $this->withHeaders(['Authorization' => "Bearer {$adminToken}"])
            ->getJson('/api/supervisor/summary')
            ->assertStatus(403);
    }

    public function test_supervisor_can_create_personnel(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/supervisor/personnel', [
                'name' => 'Juan Perez',
                'position' => 'Operador de planta',
                'status' => 'activo',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Juan Perez')
            ->assertJsonPath('created_by', $this->supervisor->id);

        $this->assertDatabaseHas('plant_personnel', ['name' => 'Juan Perez']);
    }

    public function test_supervisor_can_update_and_delete_personnel(): void
    {
        $person = PlantPersonnel::create([
            'name' => 'Maria Lopez',
            'position' => 'Chancador',
            'status' => 'activo',
            'created_by' => $this->supervisor->id,
        ]);

        $this->withHeaders($this->authHeaders())
            ->putJson("/api/supervisor/personnel/{$person->id}", [
                'name' => 'Maria Lopez G.',
                'position' => 'Supervisora de mezclado',
                'status' => 'activo',
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Maria Lopez G.');

        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/supervisor/personnel/{$person->id}")
            ->assertOk();

        $this->assertDatabaseMissing('plant_personnel', ['name' => 'Maria Lopez G.']);
    }

    public function test_personnel_list_is_returned_for_supervisor(): void
    {
        PlantPersonnel::create(['name' => 'Pedro Sanchez', 'position' => 'Operador', 'status' => 'activo', 'created_by' => $this->supervisor->id]);
        PlantPersonnel::create(['name' => 'Ana Torres', 'position' => 'Auxiliar', 'status' => 'inactivo', 'created_by' => $this->supervisor->id]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/supervisor/personnel')
            ->assertOk();

        $names = collect($response->json())->pluck('name')->all();
        $this->assertContains('Pedro Sanchez', $names);
        $this->assertContains('Ana Torres', $names);
    }

    public function test_personnel_requires_name(): void
    {
        $this->withHeaders($this->authHeaders())
            ->postJson('/api/supervisor/personnel', [
                'name' => '',
                'position' => 'Operador',
            ])
            ->assertStatus(422);
    }
}

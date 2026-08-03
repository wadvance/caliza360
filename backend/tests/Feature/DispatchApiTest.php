<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Dispatch;
use App\Models\Truck;
use App\Models\Driver;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DispatchApiTest extends TestCase
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

    public function test_create_dispatch(): void
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/dispatches', [
                             'date' => now()->toDateString(),
                             'truck_id' => $truck->id,
                             'driver_id' => $driver->id,
                             'destination_name' => 'Empresas Melo',
                             'material_type' => 'Caliza',
                             'planned_tons' => 30,
                             'actual_tons' => 28.5,
                             'sack_count' => 140,
                             'departure_datetime' => now()->toDateTimeString(),
                             'delivery_datetime' => now()->addHours(3)->toDateTimeString(),
                             'responsible_person' => 'Juan Pérez',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('destination_name', 'Empresas Melo')
                 ->assertJsonStructure(['dispatch_number', 'id']);

        $this->assertDatabaseHas('dispatches', ['responsible_person' => 'Juan Pérez']);
    }

    public function test_summary_returns_performance(): void
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        Dispatch::factory()->create([
            'date' => now()->toDateString(),
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'planned_tons' => 40,
            'actual_tons' => 38,
            'sack_count' => 200,
            'destination_name' => 'Empresas Melo',
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/dispatches/summary');

        $response->assertStatus(200)
                 ->assertJsonPath('total_deliveries', 1)
                 ->assertJsonPath('total_sacks', 200)
                 ->assertJsonPath('performance_percent', 95);
    }

    public function test_update_and_delete_dispatch(): void
    {
        $dispatch = Dispatch::factory()->create();

        $update = $this->withHeaders($this->authHeaders())
                       ->putJson("/api/dispatches/{$dispatch->id}", [
                           'date' => $dispatch->date->toDateString(),
                           'truck_id' => $dispatch->truck_id,
                           'driver_id' => $dispatch->driver_id,
                           'destination_name' => 'Cementos Panamá',
                           'material_type' => 'Caliza',
                           'planned_tons' => 30,
                           'actual_tons' => 30,
                           'responsible_person' => 'Ana García',
                       ]);

        $update->assertStatus(200)
               ->assertJsonPath('destination_name', 'Cementos Panamá');

        $this->withHeaders($this->authHeaders())
             ->deleteJson("/api/dispatches/{$dispatch->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('dispatches', ['id' => $dispatch->id]);
    }

    public function test_supervisor_cannot_access_dispatches(): void
    {
        $supervisor = User::factory()->create(['role' => 'supervisor']);
        $token = $supervisor->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->getJson('/api/dispatches')
             ->assertStatus(403);
    }
}

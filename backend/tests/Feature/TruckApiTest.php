<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Trip;
use App\Models\Client;
use App\Models\Maintenance;
use App\Models\Tire;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TruckApiTest extends TestCase
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

    public function test_get_all_trucks(): void
    {
        Truck::factory()->count(3)->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/trucks');

        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }

    public function test_create_truck(): void
    {
        $data = [
            'plate' => 'ABC-1234',
            'brand' => 'Kenworth',
            'model' => 'T800',
            'year' => 2020,
            'capacity' => 30,
            'status' => 'active',
        ];

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/trucks', $data);

        $response->assertStatus(201)
                 ->assertJsonFragment(['plate' => 'ABC-1234']);
        $this->assertDatabaseHas('trucks', ['plate' => 'ABC-1234']);
    }

    public function test_get_truck_by_id(): void
    {
        $truck = Truck::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson("/api/trucks/{$truck->id}");

        $response->assertStatus(200)
                 ->assertJson(['id' => $truck->id]);
    }

    public function test_update_truck(): void
    {
        $truck = Truck::factory()->create(['plate' => 'OLD-0000']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/trucks/{$truck->id}", ['plate' => 'NEW-1111']);

        $response->assertStatus(200)
                 ->assertJsonFragment(['plate' => 'NEW-1111']);
    }

    public function test_delete_truck(): void
    {
        $truck = Truck::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->deleteJson("/api/trucks/{$truck->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('trucks', ['id' => $truck->id]);
    }

    public function test_unauthenticated_access_returns_401(): void
    {
        $response = $this->getJson('/api/trucks');

        $response->assertStatus(401);
    }

    public function test_store_maintenance_creates_record(): void
    {
        $truck = Truck::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson("/api/trucks/{$truck->id}/maintenance", [
                             'type' => 'preventive',
                             'description' => 'Cambio de aceite',
                             'cost' => 1500,
                             'mileage_at_service' => 40000,
                         ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['type' => 'preventive']);
        $this->assertDatabaseHas('maintenances', ['truck_id' => $truck->id, 'type' => 'preventive']);
    }

    public function test_update_maintenance_for_truck(): void
    {
        $maintenance = Maintenance::factory()->create(['status' => 'scheduled']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/trucks/{$maintenance->truck_id}/maintenance/{$maintenance->id}", [
                             'status' => 'completed',
                         ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'completed']);
    }

    public function test_update_maintenance_of_other_truck_returns_404(): void
    {
        $maintenance = Maintenance::factory()->create();
        $otherTruck = Truck::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/trucks/{$otherTruck->id}/maintenance/{$maintenance->id}", [
                             'status' => 'completed',
                         ]);

        $response->assertStatus(404);
    }

    public function test_delete_maintenance(): void
    {
        $maintenance = Maintenance::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->deleteJson("/api/trucks/{$maintenance->truck_id}/maintenance/{$maintenance->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('maintenances', ['id' => $maintenance->id]);
    }

    public function test_get_tires_for_truck(): void
    {
        $truck = Truck::factory()->create();
        Tire::factory()->count(4)->create(['truck_id' => $truck->id]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson("/api/trucks/{$truck->id}/tires");

        $response->assertStatus(200)
            ->assertJsonCount(4);
    }

    public function test_store_tire(): void
    {
        $truck = Truck::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson("/api/trucks/{$truck->id}/tires", [
                             'position' => 'Delantera Izq.',
                             'brand' => 'Michelin',
                             'current_mileage' => 1000,
                             'max_mileage' => 100000,
                         ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['position' => 'Delantera Izq.']);
        $this->assertDatabaseHas('tires', ['truck_id' => $truck->id, 'brand' => 'Michelin']);
    }

    public function test_update_tire(): void
    {
        $tire = Tire::factory()->create(['status' => 'good']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/trucks/{$tire->truck_id}/tires/{$tire->id}", [
                             'status' => 'needs_replacement',
                             'current_mileage' => $tire->max_mileage,
                         ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'needs_replacement']);
    }

    public function test_delete_tire(): void
    {
        $tire = Tire::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->deleteJson("/api/trucks/{$tire->truck_id}/tires/{$tire->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('tires', ['id' => $tire->id]);
    }
}

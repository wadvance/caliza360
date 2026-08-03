<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\LoadProforma;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoadProformaApiTest extends TestCase
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

    public function test_create_proforma(): void
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/proformas', [
                             'date' => now()->toDateString(),
                             'truck_id' => $truck->id,
                             'driver_id' => $driver->id,
                             'destination_name' => 'Empresas Melo',
                             'origin_quarry' => 'Cantera Principal',
                             'material_type' => 'Caliza',
                             'weight_tons' => 25.5,
                             'sack_count' => 120,
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('destination_name', 'Empresas Melo')
                 ->assertJsonStructure(['proforma_number', 'id']);

        $this->assertDatabaseHas('load_proformas', ['sack_count' => 120]);
    }

    public function test_list_proformas_by_date(): void
    {
        LoadProforma::factory()->create([
            'date' => now()->toDateString(),
            'sack_count' => 80,
        ]);

        LoadProforma::factory()->create([
            'date' => now()->subDays(2)->toDateString(),
            'sack_count' => 50,
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/proformas?date=' . now()->toDateString());

        $response->assertStatus(200)
                 ->assertJsonCount(1);
    }

    public function test_summary_returns_sacks_and_by_destination(): void
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();
        $melo = Client::factory()->create(['name' => 'Empresas Melo']);

        LoadProforma::factory()->create([
            'date' => now()->toDateString(),
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'client_id' => $melo->id,
            'destination_name' => 'Empresas Melo',
            'weight_tons' => 25,
            'sack_count' => 120,
        ]);

        LoadProforma::factory()->create([
            'date' => now()->toDateString(),
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'destination_name' => 'Planta de Producción',
            'weight_tons' => 20,
            'sack_count' => 90,
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/proformas/summary');

        $response->assertStatus(200)
                 ->assertJsonPath('total_loads', 2)
                 ->assertJsonPath('total_sacks', 210)
                 ->assertJsonPath('total_tons', 45)
                 ->assertJsonCount(2, 'by_destination');
    }

    public function test_update_and_delete_proforma(): void
    {
        $proforma = LoadProforma::factory()->create();

        $update = $this->withHeaders($this->authHeaders())
                       ->putJson("/api/proformas/{$proforma->id}", [
                           'date' => $proforma->date->toDateString(),
                           'truck_id' => $proforma->truck_id,
                           'driver_id' => $proforma->driver_id,
                           'destination_name' => 'Concretos del Istmo',
                           'material_type' => 'Caliza',
                           'weight_tons' => 30,
                           'sack_count' => 150,
                       ]);

        $update->assertStatus(200)
               ->assertJsonPath('destination_name', 'Concretos del Istmo');

        $this->withHeaders($this->authHeaders())
             ->deleteJson("/api/proformas/{$proforma->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('load_proformas', ['id' => $proforma->id]);
    }

    public function test_driver_can_access_proformas(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $token = $driver->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->getJson('/api/proformas')
             ->assertStatus(200);
    }

    public function test_supervisor_cannot_access_proformas(): void
    {
        $supervisor = User::factory()->create(['role' => 'supervisor']);
        $token = $supervisor->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->getJson('/api/proformas')
             ->assertStatus(403);
    }
}

<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Control;
use App\Models\Truck;
use App\Models\Driver;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ControlApiTest extends TestCase
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

    public function test_create_control(): void
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/controls', [
                             'date' => now()->toDateTimeString(),
                             'location' => 'cantera',
                             'control_type' => 'salida',
                             'truck_id' => $truck->id,
                             'driver_id' => $driver->id,
                             'weight_tons' => 26.3,
                             'sack_count' => 130,
                             'responsible_person' => 'Carlos Supervisor',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('location', 'cantera')
                 ->assertJsonPath('control_type', 'salida')
                 ->assertJsonStructure(['control_number', 'id']);

        $this->assertDatabaseHas('controls', ['responsible_person' => 'Carlos Supervisor']);
    }

    public function test_summary_groups_by_location_and_type(): void
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        Control::factory()->create([
            'date' => now(),
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'location' => 'cantera',
            'control_type' => 'salida',
            'weight_tons' => 26,
            'sack_count' => 130,
        ]);

        Control::factory()->create([
            'date' => now(),
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'location' => 'planta',
            'control_type' => 'entrada',
            'weight_tons' => 26,
            'sack_count' => 130,
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/controls/summary');

        $response->assertStatus(200)
                 ->assertJsonPath('total_controls', 2)
                 ->assertJsonPath('total_tons', 52)
                 ->assertJsonCount(2, 'by_location');
    }

    public function test_update_and_delete_control(): void
    {
        $control = Control::factory()->create();

        $update = $this->withHeaders($this->authHeaders())
                       ->putJson("/api/controls/{$control->id}", [
                           'date' => $control->date->toDateTimeString(),
                           'location' => 'planta',
                           'control_type' => 'entrada',
                           'truck_id' => $control->truck_id,
                           'driver_id' => $control->driver_id,
                           'weight_tons' => 30,
                           'responsible_person' => 'Nuevo Responsable',
                       ]);

        $update->assertStatus(200)
               ->assertJsonPath('location', 'planta');

        $this->withHeaders($this->authHeaders())
             ->deleteJson("/api/controls/{$control->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('controls', ['id' => $control->id]);
    }

    public function test_driver_cannot_access_controls(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $token = $driver->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->getJson('/api/controls')
             ->assertStatus(403);
    }
}

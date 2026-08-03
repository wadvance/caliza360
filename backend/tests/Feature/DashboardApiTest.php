<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Trip;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DashboardApiTest extends TestCase
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

    public function test_get_dashboard_data(): void
    {
        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/dashboard');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'summary' => [
                         'total_trips',
                         'total_tons',
                         'total_income',
                         'total_expenses',
                     ],
                     'resources' => [
                         'active_trucks',
                         'active_drivers',
                         'trips_in_progress',
                     ],
                 ]);
    }

    public function test_get_weekly_stats(): void
    {
        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/dashboard/weekly-stats');

        $response->assertStatus(200);
    }

    public function test_get_top_clients(): void
    {
        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/dashboard/top-clients');

        $response->assertStatus(200);
    }

    public function test_dashboard_requires_auth(): void
    {
        $response = $this->getJson('/api/dashboard');

        $response->assertStatus(401);
    }

    public function test_caliza_arrivals_returns_today_arrivals(): void
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();
        $client = Client::factory()->create();

        Trip::factory()->create([
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'client_id' => $client->id,
            'material_type' => 'Caliza',
            'weight' => 25,
            'gross_weight' => 40000,
            'tare_weight' => 15000,
            'status' => 'returned',
            'scheduled_date' => now()->toDateString(),
            'return_time' => now(),
        ]);

        Trip::factory()->create([
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'client_id' => $client->id,
            'material_type' => 'Arena',
            'weight' => 20,
            'status' => 'returned',
            'scheduled_date' => now()->toDateString(),
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/dashboard/caliza-arrivals');

        $response->assertStatus(200)
                 ->assertJsonPath('total_arrivals', 1)
                 ->assertJsonStructure([
                     'date',
                     'total_arrivals',
                     'total_tons',
                     'arrivals' => [[
                         'id',
                         'truck_plate',
                         'driver_name',
                         'load_tons',
                         'arrived_at',
                         'status',
                     ]],
                 ]);
    }

    public function test_driver_daily_trips_returns_loads_and_trips(): void
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create(['name' => 'Juan Pérez']);
        $client = Client::factory()->create();

        Trip::factory()->create([
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'client_id' => $client->id,
            'material_type' => 'Caliza',
            'weight' => 25,
            'status' => 'returned',
            'scheduled_date' => now()->toDateString(),
        ]);

        Trip::factory()->create([
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'client_id' => $client->id,
            'material_type' => 'Caliza',
            'weight' => 22,
            'status' => 'delivered',
            'scheduled_date' => now()->toDateString(),
        ]);

        Trip::factory()->create([
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'client_id' => $client->id,
            'material_type' => 'Caliza',
            'weight' => 18,
            'status' => 'scheduled',
            'scheduled_date' => now()->toDateString(),
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson("/api/dashboard/driver-daily/{$driver->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('driver.name', 'Juan Pérez')
                 ->assertJsonPath('total_loads', 2)
                 ->assertJsonCount(3, 'trips');
    }
}

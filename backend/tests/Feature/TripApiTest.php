<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Trip;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TripApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected string $token;
    protected Truck $truck;
    protected Driver $driver;
    protected Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->token = $this->admin->createToken('auth-token')->plainTextToken;
        $this->truck = Truck::factory()->create(['status' => 'active']);
        $this->driver = Driver::factory()->create(['status' => 'active']);
        $this->client = Client::factory()->create();
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_record_gross_and_tare_calculates_net_weight(): void
    {
        $trip = Trip::factory()->create(['status' => 'in_transit']);

        $gross = $this->withHeaders($this->authHeaders())
            ->postJson("/api/trips/{$trip->id}/gross", ['gross_weight' => 30.5]);

        $gross->assertStatus(200);
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'gross_weight' => 30.5]);

        $tare = $this->withHeaders($this->authHeaders())
            ->postJson("/api/trips/{$trip->id}/tare", ['tare_weight' => 18.0]);

        $tare->assertStatus(200);
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'tare_weight' => 18.0, 'net_weight' => 12.5]);
    }

    public function test_record_quality_markdowns_with_inspector(): void
    {
        $trip = Trip::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
            ->postJson("/api/trips/{$trip->id}/quality", [
                'quality_status' => 'approved',
                'quality_inspector' => 'Ing. Ramos',
                'batch_code' => 'B-2026-001',
                'quality_notes' => 'Granulometría correcta',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('trips', [
            'id' => $trip->id,
            'quality_status' => 'approved',
            'batch_code' => 'B-2026-001',
            'quality_inspector' => 'Ing. Ramos',
        ]);
    }

    public function test_live_geofences_classifies_units(): void
    {
        $inQuarry = Trip::factory()->create([
            'status' => 'in_transit',
            'origin_lat' => 19.4326,
            'origin_lng' => -99.1332,
            'destination_lat' => 20.0000,
            'destination_lng' => -100.0000,
        ]);

        \App\Models\TripLocation::create([
            'trip_id' => $inQuarry->id,
            'latitude' => 19.4327,
            'longitude' => -99.1331,
            'recorded_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/trips/live/geofences?radius_km=1');

        $response->assertStatus(200)
            ->assertJsonPath('zones.in_quarry', 1);

        $trip = collect($response->json('trips'))->firstWhere('id', $inQuarry->id);
        $this->assertEquals('in_quarry', $trip['zone']);
    }

    public function test_get_all_trips(): void
    {
        Trip::factory()->count(5)->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/trips');

        $response->assertStatus(200);
    }

    public function test_create_trip(): void
    {
        $data = [
            'truck_id' => $this->truck->id,
            'driver_id' => $this->driver->id,
            'client_id' => $this->client->id,
            'origin_name' => 'Cantera Norte',
            'origin_address' => 'Km 45 Carretera Norte',
            'destination_name' => 'Centro',
            'destination_address' => 'Av. Principal 123',
            'material_type' => 'Caliza',
            'weight' => 25,
            'price_per_ton' => 350,
            'scheduled_date' => now()->addDay()->toDateString(),
            'scheduled_time' => '08:00',
        ];

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/trips', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('trips', ['material_type' => 'Caliza']);
    }

    public function test_start_trip_changes_status(): void
    {
        $trip = Trip::factory()->create(['status' => 'scheduled']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/trips/{$trip->id}/start");

        $response->assertStatus(200);
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'status' => 'in_transit']);
    }

    public function test_deliver_trip_changes_status(): void
    {
        $trip = Trip::factory()->create(['status' => 'in_transit']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/trips/{$trip->id}/deliver");

        $response->assertStatus(200);
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'status' => 'delivered']);
    }

    public function test_return_trip_changes_status(): void
    {
        $trip = Trip::factory()->create(['status' => 'delivered']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/trips/{$trip->id}/return");

        $response->assertStatus(200);
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'status' => 'returned']);
    }

    public function test_cancel_trip(): void
    {
        $trip = Trip::factory()->create(['status' => 'scheduled']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/trips/{$trip->id}/cancel");

        $response->assertStatus(200);
        $this->assertDatabaseHas('trips', ['id' => $trip->id, 'status' => 'cancelled']);
    }

    public function test_delete_trip(): void
    {
        $trip = Trip::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->deleteJson("/api/trips/{$trip->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('trips', ['id' => $trip->id]);
    }
}

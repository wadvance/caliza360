<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\LoadProforma;
use App\Models\LoadProformaLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProformaTrackingApiTest extends TestCase
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

    public function test_record_and_get_location(): void
    {
        $proforma = LoadProforma::factory()->create([
            'status' => 'in_transit',
            'origin_lat' => 8.5000,
            'origin_lng' => -80.3650,
            'destination_lat' => 9.1000,
            'destination_lng' => -79.4000,
        ]);

        $this->withHeaders($this->authHeaders())
             ->postJson("/api/proformas/{$proforma->id}/location", [
                 'latitude' => 8.6000,
                 'longitude' => -80.3000,
                 'speed' => 45,
                 'accuracy' => 8,
             ])
             ->assertStatus(201);

        $this->withHeaders($this->authHeaders())
             ->getJson("/api/proformas/{$proforma->id}/location")
             ->assertOk()
             ->assertJsonPath('proforma_id', $proforma->id)
             ->assertJsonPath('latitude', 8.6)
             ->assertJsonPath('longitude', -80.3);
    }

    public function test_tracking_returns_route_and_stats(): void
    {
        $proforma = LoadProforma::factory()->create([
            'status' => 'in_transit',
            'origin_lat' => 8.5000,
            'origin_lng' => -80.3650,
            'destination_lat' => 9.1000,
            'destination_lng' => -79.4000,
        ]);

        LoadProformaLocation::insert([
            ['load_proforma_id' => $proforma->id, 'latitude' => 8.5000, 'longitude' => -80.3650, 'speed' => 0, 'recorded_at' => now()->subMinutes(40), 'created_at' => now(), 'updated_at' => now()],
            ['load_proforma_id' => $proforma->id, 'latitude' => 8.6500, 'longitude' => -80.2500, 'speed' => 55, 'recorded_at' => now()->subMinutes(20), 'created_at' => now(), 'updated_at' => now()],
            ['load_proforma_id' => $proforma->id, 'latitude' => 8.8000, 'longitude' => -80.0000, 'speed' => 60, 'recorded_at' => now()->subMinutes(5), 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson("/api/proformas/{$proforma->id}/tracking");

        $response->assertOk()
                 ->assertJsonStructure([
                     'entity_id',
                     'type',
                     'status',
                     'route',
                     'stops',
                     'last_location',
                     'stats' => ['distance_traveled_km', 'stationary_time_seconds', 'moving_time_seconds', 'stops_count'],
                     'destination' => ['name', 'latitude', 'longitude'],
                     'progress' => ['percent', 'remaining_distance_km'],
                 ])
                 ->assertJsonPath('type', 'cantera')
                 ->assertJsonPath('entity_id', $proforma->id);

        $this->assertCount(3, $response->json('route'));
        $this->assertGreaterThan(0, $response->json('stats.distance_traveled_km'));
    }

    public function test_tracking_without_points_returns_empty(): void
    {
        $proforma = LoadProforma::factory()->create(['status' => 'in_transit']);

        $this->withHeaders($this->authHeaders())
             ->getJson("/api/proformas/{$proforma->id}/tracking")
             ->assertOk()
             ->assertJsonPath('route', [])
             ->assertJsonPath('stats.stops_count', 0)
             ->assertJsonPath('last_location', null);
    }
}

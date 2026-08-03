<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Trip;
use App\Models\TripLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TripTrackingApiTest extends TestCase
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

    public function test_tracking_returns_route_and_stats(): void
    {
        $trip = Trip::factory()->create([
            'status' => 'in_transit',
            'origin_lat' => 8.5000,
            'origin_lng' => -80.3650,
            'destination_lat' => 8.9833,
            'destination_lng' => -79.5167,
        ]);

        TripLocation::insert([
            ['trip_id' => $trip->id, 'latitude' => 8.5000, 'longitude' => -80.3650, 'speed' => 0, 'recorded_at' => now()->subMinutes(30), 'created_at' => now(), 'updated_at' => now()],
            ['trip_id' => $trip->id, 'latitude' => 8.6000, 'longitude' => -80.3000, 'speed' => 55, 'recorded_at' => now()->subMinutes(20), 'created_at' => now(), 'updated_at' => now()],
            ['trip_id' => $trip->id, 'latitude' => 8.7000, 'longitude' => -80.2000, 'speed' => 60, 'recorded_at' => now()->subMinutes(10), 'created_at' => now(), 'updated_at' => now()],
            ['trip_id' => $trip->id, 'latitude' => 8.7000, 'longitude' => -80.2000, 'speed' => 0, 'recorded_at' => now()->subMinutes(5), 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson("/api/trips/{$trip->id}/tracking");

        $response->assertStatus(200)
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
                 ]);

        $this->assertCount(4, $response->json('route'));
        $this->assertGreaterThan(0, $response->json('stats.distance_traveled_km'));
        $this->assertGreaterThanOrEqual(0, $response->json('progress.percent'));
        $this->assertArrayHasKey('remaining_distance_km', $response->json('progress'));
    }

    public function test_tracking_detects_stop_with_minimum_duration(): void
    {
        $trip = Trip::factory()->create([
            'status' => 'in_transit',
            'origin_lat' => 8.5000,
            'origin_lng' => -80.3650,
            'destination_lat' => 8.9833,
            'destination_lng' => -79.5167,
        ]);

        TripLocation::insert([
            ['trip_id' => $trip->id, 'latitude' => 8.5000, 'longitude' => -80.3650, 'speed' => 50, 'recorded_at' => now()->subMinutes(60), 'created_at' => now(), 'updated_at' => now()],
            // Parada de 10 minutos en el mismo punto (velocidad 0).
            ['trip_id' => $trip->id, 'latitude' => 8.6000, 'longitude' => -80.3000, 'speed' => 0, 'recorded_at' => now()->subMinutes(45), 'created_at' => now(), 'updated_at' => now()],
            ['trip_id' => $trip->id, 'latitude' => 8.6000, 'longitude' => -80.3000, 'speed' => 0, 'recorded_at' => now()->subMinutes(40), 'created_at' => now(), 'updated_at' => now()],
            ['trip_id' => $trip->id, 'latitude' => 8.6000, 'longitude' => -80.3000, 'speed' => 0, 'recorded_at' => now()->subMinutes(35), 'created_at' => now(), 'updated_at' => now()],
            ['trip_id' => $trip->id, 'latitude' => 8.7000, 'longitude' => -80.2000, 'speed' => 58, 'recorded_at' => now()->subMinutes(20), 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson("/api/trips/{$trip->id}/tracking");

        $response->assertStatus(200);

        $stops = $response->json('stops');
        $this->assertCount(1, $stops);
        $this->assertGreaterThanOrEqual(600, $stops[0]['duration_seconds']);
        $this->assertGreaterThanOrEqual(600, $response->json('stats.stationary_time_seconds'));
        $this->assertEquals(1, $response->json('stats.stops_count'));
    }

    public function test_tracking_without_points_returns_empty(): void
    {
        $trip = Trip::factory()->create(['status' => 'in_transit']);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson("/api/trips/{$trip->id}/tracking");

        $response->assertStatus(200)
                 ->assertJsonPath('route', [])
                 ->assertJsonPath('stats.stops_count', 0)
                 ->assertJsonPath('last_location', null);
    }
}

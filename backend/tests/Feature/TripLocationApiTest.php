<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Trip;
use Illuminate\Foundation\Testing\RefreshDatabase;

class TripLocationApiTest extends TestCase
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

    public function test_record_single_location(): void
    {
        $trip = Trip::factory()->create(['status' => 'in_transit']);

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson("/api/trips/{$trip->id}/location", [
                             'latitude' => 25.7142,
                             'longitude' => -100.5431,
                             'speed' => 62.5,
                             'accuracy' => 8.0,
                         ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['message' => 'Ubicación registrada correctamente'])
                 ->assertJsonFragment(['count' => 1]);
        $this->assertDatabaseHas('trip_locations', [
            'trip_id' => $trip->id,
            'latitude' => 25.7142,
            'longitude' => -100.5431,
        ]);
    }

    public function test_record_location_batch(): void
    {
        $trip = Trip::factory()->create(['status' => 'in_transit']);

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson("/api/trips/{$trip->id}/location", [
                             'locations' => [
                                 ['latitude' => 10.1, 'longitude' => -99.1],
                                 ['latitude' => 10.2, 'longitude' => -99.2],
                                 ['latitude' => 10.3, 'longitude' => -99.3],
                             ],
                         ]);

        $response->assertStatus(201)
                 ->assertJsonFragment(['count' => 3]);
        $this->assertDatabaseCount('trip_locations', 3);
    }

    public function test_get_latest_location(): void
    {
        $trip = Trip::factory()->create(['status' => 'in_transit']);

        $this->withHeaders($this->authHeaders())
             ->postJson("/api/trips/{$trip->id}/location", [
                 'latitude' => 20.1, 'longitude' => -100.1,
             ]);
        $this->withHeaders($this->authHeaders())
             ->postJson("/api/trips/{$trip->id}/location", [
                 'latitude' => 20.2, 'longitude' => -100.2,
             ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson("/api/trips/{$trip->id}/location");

        $response->assertStatus(200)
                 ->assertJsonFragment(['latitude' => 20.2]);
    }

    public function test_live_fleet_returns_active_trips_with_location(): void
    {
        $active = Trip::factory()->create(['status' => 'in_transit']);
        Trip::factory()->create(['status' => 'returned']);

        $this->withHeaders($this->authHeaders())
             ->postJson("/api/trips/{$active->id}/location", [
                 'latitude' => 25.77, 'longitude' => -100.54,
             ]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/trips/live');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonPath('0.id', $active->id);
    }

    public function test_requires_valid_coordinates(): void
    {
        $trip = Trip::factory()->create(['status' => 'in_transit']);

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson("/api/trips/{$trip->id}/location", [
                             'latitude' => null,
                             'longitude' => null,
                         ]);

        $response->assertStatus(422);
    }
}
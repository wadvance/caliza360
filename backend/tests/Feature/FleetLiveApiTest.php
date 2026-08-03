<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Trip;
use App\Models\LoadProforma;
use App\Models\TripLocation;
use App\Models\LoadProformaLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

class FleetLiveApiTest extends TestCase
{
    use RefreshDatabase;

    protected function authHeaders(string $role): array
    {
        $user = User::factory()->create(['role' => $role]);
        $token = $user->createToken('auth-token')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_admin_can_access_unified_fleet(): void
    {
        $trip = Trip::factory()->create(['status' => 'in_transit']);
        TripLocation::insert([
            ['trip_id' => $trip->id, 'latitude' => 8.6000, 'longitude' => -80.3000, 'speed' => 45, 'recorded_at' => now(), 'created_at' => now(), 'updated_at' => now()],
        ]);

        $proforma = LoadProforma::factory()->create(['status' => 'in_transit']);
        LoadProformaLocation::insert([
            ['load_proforma_id' => $proforma->id, 'latitude' => 8.7000, 'longitude' => -80.2000, 'speed' => 40, 'recorded_at' => now(), 'created_at' => now(), 'updated_at' => now()],
        ]);

        $response = $this->withHeaders($this->authHeaders('admin'))
                         ->getJson('/api/fleet/live');

        $response->assertOk()
                 ->assertJsonStructure(['radius_km', 'zones', 'units']);

        $units = $response->json('units');
        $this->assertCount(2, $units);

        $types = collect($units)->pluck('type')->sort()->values()->all();
        $this->assertEquals(['cantera', 'viaje'], $types);
    }

    public function test_driver_cannot_access_fleet(): void
    {
        $this->withHeaders($this->authHeaders('driver'))
             ->getJson('/api/fleet/live')
             ->assertStatus(403);
    }

    public function test_supervisor_cannot_access_fleet(): void
    {
        $this->withHeaders($this->authHeaders('supervisor'))
             ->getJson('/api/fleet/live')
             ->assertStatus(403);
    }

    public function test_super_admin_can_access_fleet(): void
    {
        $this->withHeaders($this->authHeaders('super_admin'))
             ->getJson('/api/fleet/live')
             ->assertOk();
    }
}

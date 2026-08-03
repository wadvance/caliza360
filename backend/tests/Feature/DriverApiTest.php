<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Driver;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DriverApiTest extends TestCase
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

    public function test_get_all_drivers(): void
    {
        Driver::factory()->count(3)->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/drivers');

        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }

    public function test_create_driver_with_license_and_emergency_contact(): void
    {
        $data = [
            'name' => 'Conductor Prueba',
            'email' => 'drivertest@calizalosos.com',
            'password' => 'password123',
            'phone' => '555-0200',
            'license_number' => 'LIC-12345',
            'license_type' => 'C',
            'license_expiry_date' => '2027-05-15',
            'license_issued_by' => 'SEDENA',
            'curp' => 'XXX850912HNLNMN09',
            'rfc' => 'XXX850912K01',
            'emergency_contact_name' => 'Familiar',
            'emergency_contact_phone' => '555-0909',
            'emergency_contact_relationship' => 'Hermano',
            'address' => 'Calle Ficticia 1',
            'hire_date' => '2026-01-01',
        ];

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/drivers', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'drivertest@calizalosos.com']);
        $this->assertDatabaseHas('drivers', [
            'name' => 'Conductor Prueba',
            'license_expiry_date' => '2027-05-15 00:00:00',
            'emergency_contact_name' => 'Familiar',
            'emergency_contact_relationship' => 'Hermano',
        ]);
    }

    public function test_update_driver(): void
    {
        $driver = Driver::factory()->create(['name' => 'Original']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/drivers/{$driver->id}", [
                             'name' => 'Conductor Actualizado',
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('drivers', ['id' => $driver->id, 'name' => 'Conductor Actualizado']);
    }

    public function test_delete_driver(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->deleteJson("/api/drivers/{$driver->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('drivers', ['id' => $driver->id]);
    }
}
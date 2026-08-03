<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Supplier;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SupplierApiTest extends TestCase
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

    public function test_get_all_suppliers(): void
    {
        Supplier::factory()->count(3)->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/suppliers');

        $response->assertStatus(200)
                 ->assertJsonCount(3);
    }

    public function test_create_supplier_with_rating_and_material_type(): void
    {
        $data = [
            'name' => 'Combustibles Norte',
            'company' => 'PEMEX',
            'rfc' => 'PEM861226K38',
            'email' => 'ventas@pemex.test',
            'phone' => '555-0001',
            'address' => 'Av. Industrial 123',
            'material_type' => 'Combustible',
        ];

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/suppliers', $data);

        $response->assertStatus(201)
                 ->assertJsonFragment(['name' => 'Combustibles Norte'])
                 ->assertJsonFragment(['rating' => 0])
                 ->assertJsonFragment(['material_type' => 'Combustible']);
        $this->assertDatabaseHas('suppliers', [
            'name' => 'Combustibles Norte',
            'material_type' => 'Combustible',
            'rating' => 0,
        ]);
    }

    public function test_update_supplier(): void
    {
        $supplier = Supplier::factory()->create(['name' => 'Original']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/suppliers/{$supplier->id}", [
                             'name' => 'Actualizado',
                             'material_type' => 'Llantas',
                         ]);

        $response->assertStatus(200)
                 ->assertJsonFragment(['name' => 'Actualizado']);
        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id, 'material_type' => 'Llantas']);
    }

    public function test_delete_supplier(): void
    {
        $supplier = Supplier::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->deleteJson("/api/suppliers/{$supplier->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('suppliers', ['id' => $supplier->id]);
    }

    public function test_unauthenticated_access_returns_401(): void
    {
        $response = $this->getJson('/api/suppliers');

        $response->assertStatus(401);
    }
}
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\PettyCash;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PettyCashApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'accountant']);
        $this->token = $this->admin->createToken('auth-token')->plainTextToken;
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_accountant_can_register_movement(): void
    {
        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/petty-cash', [
                             'date' => now()->toDateString(),
                             'concept' => 'Compra de útiles de oficina',
                             'type' => 'salida',
                             'amount' => 85.50,
                             'category' => 'utiles_oficina',
                             'responsible_person' => 'Secretaria',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('type', 'salida')
                 ->assertJsonPath('amount', 85.5);

        $this->assertDatabaseHas('petty_cash', ['concept' => 'Compra de útiles de oficina']);
    }

    public function test_summary_balance_is_entradas_minus_salidas(): void
    {
        PettyCash::factory()->create(['type' => 'entrada', 'amount' => 500]);
        PettyCash::factory()->create(['type' => 'salida', 'amount' => 120]);
        PettyCash::factory()->create(['type' => 'salida', 'amount' => 30.5]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/petty-cash/summary');

        $response->assertStatus(200)
                 ->assertJsonPath('total_entradas', 500)
                 ->assertJsonPath('total_salidas', 150.5)
                 ->assertJsonPath('balance', 349.5)
                 ->assertJsonPath('total_movements', 3);
    }

    public function test_update_and_delete_movement(): void
    {
        $cash = PettyCash::factory()->create();

        $this->withHeaders($this->authHeaders())
             ->putJson("/api/petty-cash/{$cash->id}", [
                 'date' => $cash->date->toDateString(),
                 'concept' => 'Viáticos actualizados',
                 'type' => 'salida',
                 'amount' => 200,
                 'responsible_person' => 'Contador',
             ])
             ->assertStatus(200)
             ->assertJsonPath('amount', 200);

        $this->withHeaders($this->authHeaders())
             ->deleteJson("/api/petty-cash/{$cash->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('petty_cash', ['id' => $cash->id]);
    }

    public function test_driver_cannot_access_petty_cash(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $token = $driver->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->getJson('/api/petty-cash')
             ->assertStatus(403);
    }
}

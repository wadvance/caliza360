<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Driver;
use App\Models\ExtraPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ExtraPaymentApiTest extends TestCase
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

    public function test_accountant_can_create_extra_payment(): void
    {
        $driver = Driver::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/extra-payments', [
                             'driver_id' => $driver->id,
                             'concept' => 'Bono de producción',
                             'description' => 'Bono por 45 viajes en el mes',
                             'amount' => 500,
                             'payment_date' => now()->toDateString(),
                             'status' => 'paid',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('concept', 'Bono de producción')
                 ->assertJsonPath('amount', 500);

        $this->assertDatabaseHas('extra_payments', ['driver_id' => $driver->id, 'amount' => 500]);
    }

    public function test_summary_totals_by_driver(): void
    {
        $driver1 = Driver::factory()->create();
        $driver2 = Driver::factory()->create();

        ExtraPayment::factory()->create(['driver_id' => $driver1->id, 'amount' => 300]);
        ExtraPayment::factory()->create(['driver_id' => $driver1->id, 'amount' => 200]);
        ExtraPayment::factory()->create(['driver_id' => $driver2->id, 'amount' => 100]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/extra-payments/summary');

        $response->assertStatus(200)
                 ->assertJsonPath('total_payments', 3)
                 ->assertJsonPath('total_amount', 600)
                 ->assertJsonCount(2, 'by_driver');
    }

    public function test_update_and_delete_extra_payment(): void
    {
        $payment = ExtraPayment::factory()->create();

        $this->withHeaders($this->authHeaders())
             ->putJson("/api/extra-payments/{$payment->id}", [
                 'driver_id' => $payment->driver_id,
                 'concept' => 'Apoyo transporte',
                 'amount' => 250,
                 'payment_date' => $payment->payment_date->toDateString(),
                 'status' => 'pending',
             ])
             ->assertStatus(200)
             ->assertJsonPath('amount', 250);

        $this->withHeaders($this->authHeaders())
             ->deleteJson("/api/extra-payments/{$payment->id}")
             ->assertStatus(200);

        $this->assertDatabaseMissing('extra_payments', ['id' => $payment->id]);
    }

    public function test_driver_cannot_access_extra_payments(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $token = $driver->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->getJson('/api/extra-payments')
             ->assertStatus(403);
    }
}

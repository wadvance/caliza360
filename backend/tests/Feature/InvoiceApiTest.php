<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Invoice;
use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;

class InvoiceApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected string $token;
    protected Client $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->token = $this->admin->createToken('auth-token')->plainTextToken;
        $this->client = Client::factory()->create();
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_get_all_invoices(): void
    {
        Invoice::factory()->count(3)->create();

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/invoices');

        $response->assertStatus(200);
    }

    public function test_create_invoice(): void
    {
        $data = [
            'type' => 'sale',
            'client_id' => $this->client->id,
            'items' => [
                ['description' => 'Caliza', 'quantity' => 25, 'unit_price' => 350],
            ],
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
        ];

        $response = $this->withHeaders($this->authHeaders())
                         ->postJson('/api/invoices', $data);

        $response->assertStatus(201);
    }

    public function test_mark_invoice_as_paid(): void
    {
        $invoice = Invoice::factory()->create(['status' => 'sent']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/invoices/{$invoice->id}/pay", [
                             'payment_method' => 'transfer',
                             'payment_date' => now()->toDateString(),
                         ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'paid']);
    }

    public function test_cancel_invoice(): void
    {
        $invoice = Invoice::factory()->create(['status' => 'draft']);

        $response = $this->withHeaders($this->authHeaders())
                         ->putJson("/api/invoices/{$invoice->id}/cancel");

        $response->assertStatus(200);
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'status' => 'cancelled']);
    }

    public function test_get_overdue_invoices(): void
    {
        Invoice::factory()->create(['status' => 'overdue', 'due_date' => now()->subDays(10)]);
        Invoice::factory()->create(['status' => 'paid', 'due_date' => now()->subDays(5)]);

        $response = $this->withHeaders($this->authHeaders())
                         ->getJson('/api/invoices/overdue');

        $response->assertStatus(200);
    }

    public function test_delete_invoice(): void
    {
        $invoice = Invoice::factory()->create(['status' => 'draft']);

        $response = $this->withHeaders($this->authHeaders())
                         ->deleteJson("/api/invoices/{$invoice->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('invoices', ['id' => $invoice->id]);
    }
}

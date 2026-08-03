<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\AccountantCost;
use App\Models\AccountantAsset;
use App\Models\AccountantBudget;
use App\Models\AccountantCompliance;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AccountantWorkspaceApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $accountant;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->accountant = User::factory()->create(['role' => 'accountant']);
        $this->token = $this->accountant->createToken('auth-token')->plainTextToken;
    }

    protected function authHeaders(): array
    {
        return ['Authorization' => "Bearer {$this->token}"];
    }

    public function test_accountant_screens_include_workspace_but_not_removed_modules(): void
    {
        $screens = $this->accountant->allowedScreens();

        $this->assertContains('dashboard', $screens);
        $this->assertContains('accountant-workspace', $screens);
        $this->assertContains('accounting', $screens);
        $this->assertNotContains('drivers', $screens);
        $this->assertNotContains('clients', $screens);
        $this->assertNotContains('suppliers', $screens);
        $this->assertNotContains('notes', $screens);
        $this->assertNotContains('reports', $screens);
    }

    public function test_accountant_can_create_cost_with_unit_cost_computed(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/accountant/costs', [
                'category' => 'combustible',
                'description' => 'Combustible para hornos',
                'amount' => 10000,
                'tonnage' => 250,
                'cost_date' => now()->toDateString(),
                'status' => 'verificado',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('description', 'Combustible para hornos')
            ->assertJsonPath('unit_cost', '40.00')
            ->assertJsonPath('created_by', $this->accountant->id);

        $this->assertDatabaseHas('accountant_costs', ['description' => 'Combustible para hornos', 'unit_cost' => 40]);
    }

    public function test_accountant_can_update_and_delete_cost(): void
    {
        $item = AccountantCost::factory()->create(['created_by' => $this->accountant->id]);

        $this->withHeaders($this->authHeaders())
            ->putJson("/api/accountant/costs/{$item->id}", [
                'description' => 'Costo actualizado',
                'category' => 'personal',
                'amount' => 5000,
                'tonnage' => 100,
                'cost_date' => now()->toDateString(),
            ])
            ->assertStatus(200)
            ->assertJsonPath('description', 'Costo actualizado')
            ->assertJsonPath('unit_cost', '50.00');

        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/accountant/costs/{$item->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('accountant_costs', ['id' => $item->id]);
    }

    public function test_accountant_can_register_asset(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/accountant/assets', [
                'name' => 'Chancadora primaria 500 HP',
                'type' => 'maquinaria',
                'acquisition_value' => 850000,
                'acquisition_date' => now()->subYears(3)->toDateString(),
                'useful_life_years' => 10,
                'salvage_value' => 50000,
                'accumulated_depreciation' => 240000,
                'status' => 'activo',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Chancadora primaria 500 HP');

        $this->assertDatabaseHas('accountant_assets', ['name' => 'Chancadora primaria 500 HP']);
    }

    public function test_asset_annual_depreciation_is_linear(): void
    {
        $asset = AccountantAsset::factory()->create([
            'acquisition_value' => 100000,
            'salvage_value' => 10000,
            'useful_life_years' => 10,
            'created_by' => $this->accountant->id,
        ]);

        $this->assertEquals(9000, $asset->annualDepreciation());
    }

    public function test_accountant_can_manage_budgets(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/accountant/budgets', [
                'title' => 'CAPEX renovación flota',
                'budget_type' => 'capex',
                'category' => 'proyecto',
                'planned_amount' => 200000,
                'actual_amount' => 0,
                'period' => date('Y'),
                'status' => 'borrador',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('budget_type', 'capex');

        $id = $response->json('id');
        $this->withHeaders($this->authHeaders())
            ->putJson("/api/accountant/budgets/{$id}", [
                'title' => 'CAPEX renovación flota',
                'budget_type' => 'capex',
                'category' => 'proyecto',
                'planned_amount' => 200000,
                'actual_amount' => 50000,
                'status' => 'aprobado',
            ])
            ->assertStatus(200)
            ->assertJsonPath('status', 'aprobado');

        $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/accountant/budgets/{$id}")
            ->assertStatus(200);
    }

    public function test_accountant_can_register_compliance_obligation(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/accountant/compliance', [
                'type' => 'provision_cierre_mina',
                'title' => 'Provisión cierre de mina',
                'amount' => 75000,
                'due_date' => now()->addMonths(6)->toDateString(),
                'status' => 'provisionado',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('type', 'provision_cierre_mina');

        $this->assertDatabaseHas('accountant_compliance', ['title' => 'Provisión cierre de mina']);
    }

    public function test_accountant_summary_has_expected_structure(): void
    {
        AccountantCost::factory()->create([
            'category' => 'combustible',
            'amount' => 10000,
            'tonnage' => 250,
            'cost_date' => now()->toDateString(),
            'status' => 'verificado',
            'created_by' => $this->accountant->id,
        ]);
        AccountantAsset::factory()->create([
            'acquisition_value' => 100000,
            'salvage_value' => 10000,
            'useful_life_years' => 10,
            'accumulated_depreciation' => 20000,
            'status' => 'activo',
            'created_by' => $this->accountant->id,
        ]);
        AccountantBudget::factory()->create([
            'budget_type' => 'opex',
            'planned_amount' => 50000,
            'actual_amount' => 40000,
            'status' => 'aprobado',
            'created_by' => $this->accountant->id,
        ]);
        AccountantCompliance::factory()->create([
            'type' => 'impuesto_extractivo',
            'status' => 'pendiente',
            'created_by' => $this->accountant->id,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/accountant/summary')
            ->assertOk();

        $response->assertJsonStructure([
            'costs' => ['month_amount', 'month_tonnage', 'unit_cost_per_ton', 'electricity', 'fuel', 'machinery', 'explosives', 'labor'],
            'assets' => ['active', 'total_value', 'accumulated_depreciation', 'annual_depreciation'],
            'budgets' => ['capex_planned', 'capex_actual', 'opex_planned', 'opex_actual'],
            'compliance' => ['pending', 'overdue', 'provisions'],
        ]);

        $this->assertEquals(40, $response->json('costs.unit_cost_per_ton'));
        $this->assertEquals(9000, $response->json('assets.annual_depreciation'));
        $this->assertEquals(50000, $response->json('budgets.opex_planned'));
        $this->assertEquals(1, $response->json('compliance.pending'));
    }

    public function test_admin_cannot_access_accountant_workspace(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $adminToken = $admin->createToken('auth-token')->plainTextToken;

        $this->withHeaders(['Authorization' => "Bearer {$adminToken}"])
            ->getJson('/api/accountant/summary')
            ->assertStatus(403);
    }
}

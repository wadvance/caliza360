<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PanamaApiTest extends TestCase
{
    use RefreshDatabase;

    private function authHeaders(): array
    {
        $user = User::factory()->create(['role' => 'super_admin']);
        $token = $user->createToken('test')->plainTextToken;

        return ['Authorization' => 'Bearer ' . $token];
    }

    public function test_locations_returns_panama_geography(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/panama/locations');

        $response->assertOk()
            ->assertJsonStructure(['provincias' => [['nombre', 'distritos' => [['nombre', 'corregimientos']]]]]);

        $provincias = $response->json('provincias');
        $this->assertNotEmpty($provincias);
        $this->assertTrue(count($provincias) >= 10, 'Debe incluir al menos las 10 provincias de Panamá');

        $panama = collect($provincias)->firstWhere('nombre', 'Panamá');
        $this->assertNotNull($panama);
        $this->assertTrue(
            collect($panama['distritos'])->contains(fn ($d) => $d['nombre'] === 'Panamá'),
            'Debe existir el distrito Panamá con sus corregimientos'
        );
    }
}

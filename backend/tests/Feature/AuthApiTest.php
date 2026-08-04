<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create([
            'email' => 'admin@calizalosos.com',
            'password' => bcrypt('password123'),
            'role' => 'admin',
        ]);
    }

    public function test_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@calizalosos.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'token',
                     'screens',
                     'user' => ['id', 'name', 'email', 'role'],
                 ]);
    }

    public function test_login_returns_screens_for_role(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@calizalosos.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('user.role', 'admin')
                 ->assertJsonPath('screens', config('permissions.screens.admin'));
    }

    public function test_login_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@calizalosos.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_with_nonexistent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    public function test_me_returns_user_data(): void
    {
        $token = $this->user->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJsonPath('user.id', $this->user->id)
                 ->assertJsonPath('user.email', $this->user->email)
                 ->assertJsonPath('screens', config('permissions.screens.admin'));
    }

    public function test_me_without_token_returns_401(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    public function test_login_rejected_when_user_has_active_session_on_another_device(): void
    {
        $this->user->createToken('auth-token');

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@calizalosos.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors('email')
                 ->assertJsonPath('errors.email.0', 'Usuario ya conectado. Cierre sesión en el otro dispositivo para continuar.');
    }

    public function test_logout_deletes_token_and_allows_relogin(): void
    {
        $token = $this->user->createToken('auth-token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
             ->postJson('/api/auth/logout')
             ->assertStatus(200);

        $this->assertSame(0, $this->user->tokens()->count());

        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@calizalosos.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token']);
    }

    public function test_register_new_user(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $token = $admin->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson('/api/auth/register', [
                             'name' => 'Test User',
                             'email' => 'test@test.com',
                             'password' => 'password123',
                             'password_confirmation' => 'password123',
                             'role' => 'supervisor',
                         ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['user']);
    }

    public function test_admin_cannot_register_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = $admin->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson('/api/auth/register', [
                             'name' => 'Otro Admin',
                             'email' => 'otroadmin@test.com',
                             'password' => 'password123',
                             'password_confirmation' => 'password123',
                             'role' => 'admin',
                         ]);

        $response->assertStatus(422);
    }

    public function test_register_with_duplicate_email(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $token = $admin->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->postJson('/api/auth/register', [
                             'name' => 'Duplicate',
                             'email' => 'admin@calizalosos.com',
                             'password' => 'password123',
                             'password_confirmation' => 'password123',
                         ]);

        $response->assertStatus(422);
    }

    public function test_register_requires_auth(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Sin Token',
            'email' => 'sintoken@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'driver',
        ]);

        $response->assertStatus(401);
    }

    public function test_driver_cannot_access_trucks_module(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $token = $driver->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->getJson('/api/trucks');

        $response->assertStatus(403);
    }

    public function test_driver_can_access_trips_module(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $token = $driver->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->getJson('/api/trips');

        $response->assertStatus(200);
    }

    public function test_driver_cannot_access_user_management(): void
    {
        $driver = User::factory()->create(['role' => 'driver']);
        $token = $driver->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->getJson('/api/auth/users');

        $response->assertStatus(403);
    }

    public function test_dispatcher_cannot_access_accounting_module(): void
    {
        $dispatcher = User::factory()->create(['role' => 'dispatcher']);
        $token = $dispatcher->createToken('auth-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
                         ->getJson('/api/accounting/accounts-receivable');

        $response->assertStatus(403);
    }
}

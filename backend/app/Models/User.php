<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Services\FirebaseService;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'id',
        'name',
        'email',
        'password',
        'role',
        'phone',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    const ROLE_SUPER_ADMIN = 'super_admin';
    const ROLE_ADMIN = 'admin';
    const ROLE_DISPATCHER = 'dispatcher';
    const ROLE_DRIVER = 'driver';
    const ROLE_ACCOUNTANT = 'accountant';
    const ROLE_SUPERVISOR = 'supervisor';
    const ROLE_SECRETARY = 'secretary';

    const ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_ADMIN,
        self::ROLE_DISPATCHER,
        self::ROLE_DRIVER,
        self::ROLE_ACCOUNTANT,
        self::ROLE_SUPERVISOR,
        self::ROLE_SECRETARY,
    ];

    const ROLE_LABELS = [
        self::ROLE_SUPER_ADMIN => 'Super Admin',
        self::ROLE_ADMIN => 'Admin',
        self::ROLE_DISPATCHER => 'Despacho',
        self::ROLE_DRIVER => 'Camionero',
        self::ROLE_ACCOUNTANT => 'Contador',
        self::ROLE_SUPERVISOR => 'Supervisor',
        self::ROLE_SECRETARY => 'Secretaria',
    ];

    public function isSuperAdmin()
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isAdmin()
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isDispatcher()
    {
        return $this->role === self::ROLE_DISPATCHER;
    }

    public function isDriver()
    {
        return $this->role === self::ROLE_DRIVER;
    }

    public function isAccountant()
    {
        return $this->role === self::ROLE_ACCOUNTANT;
    }

    public function hasRole($role)
    {
        return $this->role === $role;
    }

    public function hasAnyRole(array $roles)
    {
        return in_array($this->role, $roles);
    }

    /**
     * Lista de pantallas (módulos) a los que tiene acceso este usuario.
     */
    public function allowedScreens(): array
    {
        return config('permissions.screens.' . $this->role, []);
    }

    public function canAccessScreen(string $screen): bool
    {
        return in_array($screen, $this->allowedScreens());
    }

    public function canManageUsers(): bool
    {
        return in_array($this->role, config('permissions.user_management', []));
    }
}

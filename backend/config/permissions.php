<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Permisos por rol
    |--------------------------------------------------------------------------
    | Cada rol declara las "pantallas" (módulos) a las que tiene acceso.
    | Los módulos son: dashboard, trucks, drivers, trips, live-map, clients,
    | suppliers, inventory, invoices, accounting, payroll, reports, ai,
    | settings, settings-email, users, proformas, controls, dispatches.
    | La secretaria usa: dashboard, notes, whatsapp, secretary-workspace.
    | El supervisor usa: dashboard, trucks, drivers, trips, controls, supervisor-workspace.
    | El contador usa: dashboard, inventory, invoices, accounting, payroll,
    | extra-payments, petty-cash, accountant-workspace.
    */

    'screens' => [
        'super_admin' => [
            'dashboard', 'trucks', 'drivers', 'trips', 'live-map',
            'clients', 'suppliers', 'inventory', 'invoices', 'accounting',
            'payroll', 'reports', 'ai', 'settings', 'settings-email', 'users',
            'proformas', 'controls', 'dispatches', 'notes', 'extra-payments', 'petty-cash',
            'personnel',
        ],
        'admin' => [
            'dashboard', 'trucks', 'drivers', 'trips', 'live-map',
            'clients', 'suppliers', 'inventory', 'invoices', 'accounting',
            'payroll', 'reports', 'ai', 'settings', 'settings-email', 'users',
            'proformas', 'controls', 'dispatches', 'notes', 'extra-payments', 'petty-cash',
            'personnel',
        ],
        'dispatcher' => [
            'dashboard', 'trucks', 'drivers', 'trips',
            'clients', 'inventory', 'reports', 'proformas', 'controls', 'dispatches',
            'notes',
        ],
        'supervisor' => [
            'dashboard', 'trucks', 'drivers', 'trips',
            'controls', 'supervisor-workspace',
        ],
        'accountant' => [
            'dashboard', 'inventory', 'invoices',
            'accounting', 'payroll', 'extra-payments', 'petty-cash',
            'accountant-workspace',
        ],
        'secretary' => [
            'dashboard', 'notes', 'whatsapp', 'secretary-workspace', 'personnel',
        ],
        'driver' => [
            'dashboard', 'trips', 'proformas',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Roles con gestión de usuarios
    |--------------------------------------------------------------------------
    | Quién puede crear/modificar usuarios del sistema.
    */
    'user_management' => [
        'super_admin', 'admin',
    ],

    /*
    |--------------------------------------------------------------------------
    | Roles que un Admin puede asignar al crear usuarios
    | (el Super Admin puede asignar todos).
    |--------------------------------------------------------------------------
    */
    'assignable_by_admin' => [
        'dispatcher', 'driver', 'accountant', 'supervisor', 'secretary',
    ],
];

<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Email Report Recipients
    |--------------------------------------------------------------------------
    |
    | Configure who receives each type of report.
    |
    */

    'recipients' => [
        // Daily summary recipients
        'daily' => [
            'admin@calizalosos.com',
            'gerente@calizalosos.com',
        ],

        // Weekly summary recipients
        'weekly' => [
            'admin@calizalosos.com',
            'gerente@calizalosos.com',
            'contador@calizalosos.com',
        ],

        // Alert recipients (inventory, maintenance, overdue invoices)
        'alerts' => [
            'admin@calizalosos.com',
            'almacen@calizalosos.com',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Report Schedule
    |--------------------------------------------------------------------------
    |
    | Configure when reports are sent automatically.
    |
    */

    'schedule' => [
        'daily' => '07:00',    // Send daily summary at 7:00 AM
        'weekly' => '08:00',   // Send weekly summary on Monday at 8:00 AM
        'alerts' => '09:00',   // Check and send alerts at 9:00 AM
    ],
];

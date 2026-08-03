<?php

return [

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Cloud API (Meta)
    |--------------------------------------------------------------------------
    |
    | Configuración para el envío real de mensajes a través de la API Cloud
    | de WhatsApp de Meta. Los valores se leen desde el archivo .env.
    |
    | Para obtener las credenciales:
    | 1. Crear una app en https://developers.facebook.com
    | 2. Agregar el producto "WhatsApp" (Cloud API)
    | 3. Vincular un número de teléfono de negocio y obtener el token de acceso
    |
    */

    'enabled' => env('WHATSAPP_ENABLED', false),

    'api_version' => env('WHATSAPP_API_VERSION', 'v21.0'),

    'token' => env('WHATSAPP_ACCESS_TOKEN'),

    'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),

    'business_phone' => env('WHATSAPP_BUSINESS_PHONE'),

    // Token de verificación del webhook (lo configuras tú mismo en Meta)
    'webhook_verify_token' => env('WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'caliza-los-osos-2026'),

    // Prefijo internacional de destino si el teléfono no lo incluye
    'default_country_code' => env('WHATSAPP_DEFAULT_COUNTRY_CODE', '507'),

    'timeout' => (float) env('WHATSAPP_TIMEOUT', 15),
];

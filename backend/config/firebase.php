<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Firebase services including Firestore, Authentication,
    | and Cloud Messaging.
    |
    */

    'service_account' => env('FIREBASE_SERVICE_ACCOUNT'),

    'database_url' => env('FIREBASE_DATABASE_URL'),

    'project_id' => env('FIREBASE_PROJECT_ID'),

    'api_key' => env('FIREBASE_API_KEY'),

    'storage_bucket' => env('FIREBASE_STORAGE_BUCKET'),

    'messaging_sender_id' => env('FIREBASE_MESSAGING_SENDER_ID'),

    'app_id' => env('FIREBASE_APP_ID'),
];

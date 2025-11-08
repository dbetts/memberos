<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'fitflow' => [
        'api_token' => env('FITFLOW_API_TOKEN', env('MEMBEROS_API_TOKEN')),
        'webhook_secret' => env('FITFLOW_WEBHOOK_SECRET', env('MEMBEROS_WEBHOOK_SECRET', 'demo-secret')),
        'webhook_endpoints' => array_filter(
            explode(',', env('FITFLOW_WEBHOOK_ENDPOINTS', env('MEMBEROS_WEBHOOK_ENDPOINTS', '')))
        ),
    ],
    'stripe' => [
        'secret' => env('STRIPE_SECRET'),
        'subscription_amount_cents' => env('STRIPE_AMOUNT_CENTS', 9995),
    ],

];

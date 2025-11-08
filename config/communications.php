<?php

return [
    'quiet_hours' => [
        'start' => '21:00:00',
        'end' => '08:00:00',
    ],

    'send_caps' => [
        'daily' => 3,
        'weekly' => 12,
    ],

    'stop_keywords' => [
        'STOP',
        'UNSUBSCRIBE',
        'CANCEL',
        'QUIT',
    ],

    'channels' => [
        'sms' => [
            'max_length' => 480,
        ],
        'email' => [
            'max_subject_length' => 160,
        ],
    ],

    'disclaimer' => 'SMS is convenient but less secure than using an authenticator app. We recommend enabling authenticator-based MFA whenever possible.',
];

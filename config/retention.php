<?php

return [
    'risk_bands' => [
        'low' => [
            'min' => 0,
            'max' => 25,
        ],
        'medium' => [
            'min' => 26,
            'max' => 60,
        ],
        'high' => [
            'min' => 61,
            'max' => 85,
        ],
        'critical' => [
            'min' => 86,
            'max' => 100,
        ],
    ],

    'streak_break_days' => 7,

    'missed_bookings_threshold' => [
        'count' => 2,
        'window_days' => 14,
    ],

    'billing_risk' => [
        'overdue_days' => 7,
    ],

    'processing_sla_seconds' => 300,
];

<?php

namespace App\Console\Commands;

use App\Models\ObservabilityEvent;
use App\Models\Organization;
use Illuminate\Console\Command;

class EmitHeartbeat extends Command
{
    protected $signature = 'observability:heartbeat';
    protected $description = 'Emit an uptime heartbeat observability event';

    public function handle(): int
    {
        $organizationId = Organization::value('id');
        if (! $organizationId) {
            $this->warn('No organization found.');
            return self::SUCCESS;
        }

        ObservabilityEvent::create([
            'organization_id' => $organizationId,
            'event_type' => 'uptime.heartbeat',
            'severity' => 'info',
            'context' => ['timestamp' => now()->toIso8601String()],
        ]);

        $this->info('Heartbeat emitted.');
        return self::SUCCESS;
    }
}

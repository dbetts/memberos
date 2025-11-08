<?php

namespace App\Jobs;

use App\Models\PlaybookExecution;
use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessPlaybookExecution implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $playbookExecutionId,
        public readonly int $slaSeconds = 300,
    ) {
    }

    public function handle(): void
    {
        /** @var PlaybookExecution $execution */
        $execution = PlaybookExecution::with(['playbook', 'member', 'lead'])->find($this->playbookExecutionId);

        if (! $execution || $execution->status !== 'pending') {
            return;
        }

        $playbook = $execution->playbook;
        $targetName = $execution->member?->first_name ?? $execution->lead?->first_name ?? 'there';
        $body = $execution->context['message'] ?? "Hey {$targetName}, we have a spot for you!";

        $message = Message::create([
            'organization_id' => $execution->organization_id,
            'member_id' => $execution->member_id,
            'lead_id' => $execution->lead_id,
            'message_template_id' => $playbook->primary_template_id,
            'playbook_id' => $execution->playbook_id,
            'channel' => $playbook->channel_strategy['primary'] ?? 'sms',
            'body_text' => $body,
            'status' => 'queued',
            'queued_at' => now(),
        ]);

        $execution->message_id = $message->id;
        $execution->status = 'sent';
        $execution->processed_at = now();
        $execution->outcome = ['sla_met' => now()->diffInSeconds($execution->triggered_at) <= $this->slaSeconds];
        $execution->save();
    }
}

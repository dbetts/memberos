<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'member_id',
        'lead_id',
        'message_template_id',
        'playbook_id',
        'channel',
        'subject',
        'body_html',
        'body_text',
        'status',
        'delivery_meta',
        'queued_at',
        'sent_at',
        'delivered_at',
        'failed_at',
        'error_code',
        'error_message',
        'metrics',
    ];

    protected $casts = [
        'delivery_meta' => 'array',
        'metrics' => 'array',
        'queued_at' => 'datetime',
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(MessageTemplate::class, 'message_template_id');
    }

    public function playbook(): BelongsTo
    {
        return $this->belongsTo(Playbook::class);
    }
}

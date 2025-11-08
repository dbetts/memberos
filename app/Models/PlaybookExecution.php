<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlaybookExecution extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'playbook_id',
        'playbook_version_id',
        'organization_id',
        'member_id',
        'lead_id',
        'message_id',
        'status',
        'context',
        'outcome',
        'triggered_at',
        'processed_at',
    ];

    protected $casts = [
        'context' => 'array',
        'outcome' => 'array',
        'triggered_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function playbook(): BelongsTo
    {
        return $this->belongsTo(Playbook::class);
    }

    public function version(): BelongsTo
    {
        return $this->belongsTo(PlaybookVersion::class, 'playbook_version_id');
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Playbook extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'name',
        'status',
        'trigger_type',
        'trigger_config',
        'audience_filter',
        'channel_strategy',
        'throttle_rules',
        'quiet_hours',
        'primary_template_id',
        'description',
        'created_by',
        'updated_by',
        'activated_at',
        'paused_at',
        'archived_at',
    ];

    protected $casts = [
        'trigger_config' => 'array',
        'audience_filter' => 'array',
        'channel_strategy' => 'array',
        'throttle_rules' => 'array',
        'quiet_hours' => 'array',
        'activated_at' => 'datetime',
        'paused_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function primaryTemplate(): BelongsTo
    {
        return $this->belongsTo(MessageTemplate::class, 'primary_template_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PlaybookVersion::class);
    }

    public function executions(): HasMany
    {
        return $this->hasMany(PlaybookExecution::class);
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CadenceStep extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'cadence_id',
        'step_order',
        'channel',
        'message_template_id',
        'delay_minutes',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function cadence(): BelongsTo
    {
        return $this->belongsTo(Cadence::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(MessageTemplate::class, 'message_template_id');
    }
}

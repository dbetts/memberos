<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadTask extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'lead_id',
        'cadence_step_id',
        'assigned_to',
        'type',
        'notes',
        'due_at',
        'completed_at',
        'status',
    ];

    protected $casts = [
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function cadenceStep(): BelongsTo
    {
        return $this->belongsTo(CadenceStep::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}

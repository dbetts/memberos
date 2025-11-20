<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkoutItem extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'workout_session_id',
        'organization_id',
        'title',
        'block',
        'instructions',
        'coach_notes',
        'athlete_notes',
        'color',
        'position',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(WorkoutSession::class, 'workout_session_id');
    }
}

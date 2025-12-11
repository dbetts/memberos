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
        'workout_id',
        'title',
        'instructions',
        'coach_notes',
        'athlete_notes',
        'color',
        'position',
        'exercise_id',
        'exercise_type',
        'reps',
        'metric',
        'visible_to',
        'measurement_type',
        'measurement',
        'rest_seconds',
        'is_scored',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'measurement' => 'array',
        'is_scored' => 'boolean',
        'rest_seconds' => 'integer',
        'reps' => 'array',
    ];

    public function workout(): BelongsTo
    {
        return $this->belongsTo(Workout::class);
    }
}

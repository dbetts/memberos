<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkoutSession extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'workout_program_id',
        'organization_id',
        'scheduled_for',
        'label',
        'position',
    ];

    protected $casts = [
        'scheduled_for' => 'date',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(WorkoutProgram::class, 'workout_program_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(WorkoutItem::class);
    }
}

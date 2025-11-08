<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RiskScore extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'member_id',
        'organization_id',
        'score',
        'reasons',
        'calculated_at',
    ];

    protected $casts = [
        'calculated_at' => 'datetime',
        'reasons' => 'array',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(RiskScoreSnapshot::class);
    }
}

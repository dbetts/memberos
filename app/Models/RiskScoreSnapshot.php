<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiskScoreSnapshot extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'risk_score_id',
        'score',
        'reasons',
        'calculated_at',
    ];

    protected $casts = [
        'reasons' => 'array',
        'calculated_at' => 'datetime',
    ];

    public function riskScore(): BelongsTo
    {
        return $this->belongsTo(RiskScore::class);
    }
}

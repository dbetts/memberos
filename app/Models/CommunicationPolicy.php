<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunicationPolicy extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'quiet_hours_start',
        'quiet_hours_end',
        'default_daily_cap',
        'default_weekly_cap',
        'timezone_strategy',
        'enforce_stop_keywords',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'enforce_stop_keywords' => 'bool',
        'metadata' => 'array',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}

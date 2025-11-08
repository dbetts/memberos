<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KpiSnapshot extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'period_start',
        'period_end',
        'monthly_churn_rate',
        'ninety_day_survival_rate',
        'class_fill_percent',
        'no_show_percent',
        'waitlist_conversion_percent',
        'lead_to_trial_rate',
        'trial_to_join_rate',
        'mrr_cents',
        'dimensions',
        'breakdown',
        'calculated_by',
        'calculated_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'dimensions' => 'array',
        'breakdown' => 'array',
        'calculated_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}

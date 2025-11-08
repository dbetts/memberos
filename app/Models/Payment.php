<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'member_id',
        'membership_plan_id',
        'amount_cents',
        'currency',
        'cycle',
        'status',
        'due_on',
        'paid_on',
        'next_bill_on',
        'external_id',
        'metadata',
    ];

    protected $casts = [
        'due_on' => 'date',
        'paid_on' => 'date',
        'next_bill_on' => 'date',
        'metadata' => 'array',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}

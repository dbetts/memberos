<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberMergeCandidate extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'primary_member_id',
        'conflicting_member_id',
        'confidence_score',
        'status',
        'signals',
        'resolved_by',
        'resolved_at',
        'resolution_notes',
    ];

    protected $casts = [
        'signals' => 'array',
        'confidence_score' => 'float',
        'resolved_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function primaryMember(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'primary_member_id');
    }

    public function conflictingMember(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'conflicting_member_id');
    }
}

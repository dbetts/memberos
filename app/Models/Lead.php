<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'owner_id',
        'converted_member_id',
        'first_name',
        'last_name',
        'email_encrypted',
        'email_hash',
        'phone_encrypted',
        'phone_hash',
        'source',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'stage',
        'score',
        'preferred_contact_channel',
        'preferred_location_id',
        'consents',
        'timezone',
        'notes',
        'duplicate_of_id',
        'archived_at',
        'metadata',
        'cadence_id',
        'cadence_started_at',
    ];

    protected $casts = [
        'consents' => 'array',
        'metadata' => 'array',
        'archived_at' => 'datetime',
        'cadence_started_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function convertedMember(): BelongsTo
    {
        return $this->belongsTo(Member::class, 'converted_member_id');
    }

    public function preferredLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'preferred_location_id');
    }

    public function cadence(): BelongsTo
    {
        return $this->belongsTo(Cadence::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(LeadTask::class);
    }

    public function stageLogs(): HasMany
    {
        return $this->hasMany(LeadStageLog::class);
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Member extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'home_location_id',
        'membership_plan_id',
        'first_name',
        'last_name',
        'email_encrypted',
        'email_hash',
        'phone_encrypted',
        'phone_hash',
        'date_of_birth',
        'gender',
        'joined_on',
        'status',
        'preferred_contact_channel',
        'timezone',
        'daily_send_cap',
        'weekly_send_cap',
        'quiet_hours_start',
        'quiet_hours_end',
        'quiet_hours_override',
        'consents',
        'tags',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'joined_on' => 'date',
        'date_of_birth' => 'date',
        'consents' => 'array',
        'tags' => 'array',
        'metadata' => 'array',
        'quiet_hours_override' => 'bool',
    ];

    protected $hidden = [
        'email_encrypted',
        'email_hash',
        'phone_encrypted',
        'phone_hash',
    ];

    protected $appends = [
        'email',
        'phone',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function homeLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'home_location_id');
    }

    public function membershipPlan(): BelongsTo
    {
        return $this->belongsTo(MembershipPlan::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function booking(): HasOne
    {
        return $this->hasOne(Booking::class)->latest('booked_at');
    }

    public function account(): HasOne
    {
        return $this->hasOne(MemberAccount::class);
    }

    public function riskScore(): HasOne
    {
        return $this->hasOne(RiskScore::class);
    }

    public function checkIns(): HasMany
    {
        return $this->hasMany(CheckIn::class);
    }

    public function getEmailAttribute(): ?string
    {
        if (! $this->email_encrypted) {
            return null;
        }

        try {
            return decrypt($this->email_encrypted);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function getPhoneAttribute(): ?string
    {
        if (! $this->phone_encrypted) {
            return null;
        }

        try {
            return decrypt($this->phone_encrypted);
        } catch (\Throwable $e) {
            return null;
        }
    }
}

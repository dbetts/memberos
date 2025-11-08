<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'name',
        'slug',
        'primary_timezone',
        'is_active',
        'metadata',
        'subdomain',
        'custom_domain',
        'support_email',
        'logo_path',
        'primary_color',
        'accent_color',
        'smtp_settings',
        'branding_overrides',
    ];

    protected $casts = [
        'is_active' => 'bool',
        'metadata' => 'array',
        'smtp_settings' => 'array',
        'branding_overrides' => 'array',
    ];

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }

    public function membershipPlans(): HasMany
    {
        return $this->hasMany(MembershipPlan::class);
    }

    public function settings(): HasMany
    {
        return $this->hasMany(OrganizationSetting::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffProfile extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'user_id',
        'organization_id',
        'title',
        'is_instructor',
        'bio',
        'certifications',
        'specialties',
        'primary_location_id',
    ];

    protected $casts = [
        'is_instructor' => 'bool',
        'certifications' => 'array',
        'specialties' => 'array',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function primaryLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'primary_location_id');
    }
}

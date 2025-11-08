<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberAccount extends Authenticatable
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'member_id',
        'email',
        'password',
        'email_verified_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}

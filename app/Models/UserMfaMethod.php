<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMfaMethod extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'user_id',
        'type',
        'label',
        'phone_encrypted',
        'phone_hash',
        'secret_encrypted',
        'is_primary',
        'verified_at',
        'last_used_at',
    ];

    protected $casts = [
        'is_primary' => 'bool',
        'verified_at' => 'datetime',
        'last_used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

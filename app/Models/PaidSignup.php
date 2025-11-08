<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaidSignup extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'user_id',
        'admin_email',
        'admin_name',
        'token',
        'payment_reference',
        'temp_password_encrypted',
        'status',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function decryptedPassword(): ?string
    {
        if (! $this->temp_password_encrypted) {
            return null;
        }

        try {
            return decrypt($this->temp_password_encrypted);
        } catch (\Throwable) {
            return null;
        }
    }
}

<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberExternalId extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'member_id',
        'provider',
        'external_id',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}

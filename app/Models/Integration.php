<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Integration extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'provider',
        'status',
        'configuration',
        'sync_cursors',
        'last_synced_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'configuration' => 'array',
        'sync_cursors' => 'array',
        'last_synced_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}

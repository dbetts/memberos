<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MessageTemplate extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'channel',
        'name',
        'slug',
        'subject',
        'content_html',
        'content_text',
        'editor_state',
        'variables',
        'is_default',
        'requires_review',
        'created_by',
        'updated_by',
        'archived_at',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_default' => 'bool',
        'requires_review' => 'bool',
        'archived_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }
}

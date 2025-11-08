<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlaybookVersion extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'playbook_id',
        'version',
        'definition',
        'change_summary',
        'created_by',
    ];

    protected $casts = [
        'definition' => 'array',
    ];

    public function playbook(): BelongsTo
    {
        return $this->belongsTo(Playbook::class);
    }

    public function executions(): HasMany
    {
        return $this->hasMany(PlaybookExecution::class);
    }
}

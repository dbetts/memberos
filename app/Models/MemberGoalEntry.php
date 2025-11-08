<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberGoalEntry extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'member_id',
        'type',
        'title',
        'description',
        'target_date',
        'completed',
    ];

    protected $casts = [
        'target_date' => 'date',
        'completed' => 'bool',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}

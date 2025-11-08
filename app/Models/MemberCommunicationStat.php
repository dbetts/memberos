<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemberCommunicationStat extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'member_id',
        'bucket_date',
        'queued_count',
        'sent_count',
        'delivered_count',
        'failed_count',
    ];

    protected $casts = [
        'bucket_date' => 'date',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }
}

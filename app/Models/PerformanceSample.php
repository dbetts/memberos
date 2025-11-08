<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceSample extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    public $timestamps = false;

    protected $fillable = [
        'organization_id',
        'channel',
        'path',
        'duration_ms',
        'recorded_at',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
    ];
}

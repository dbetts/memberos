<?php

namespace App\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    use HasFactory;
    use HasUuidPrimaryKey;

    protected $fillable = [
        'organization_id',
        'name',
        'slug',
        'type',
        'category',
        'modality',
        'is_public',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_public' => 'boolean',
    ];
}

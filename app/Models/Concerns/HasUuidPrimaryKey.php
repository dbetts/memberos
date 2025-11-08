<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

trait HasUuidPrimaryKey
{
    use HasUuids;

    protected function initializeHasUuidPrimaryKey(): void
    {
        $this->setIncrementing(false);
        $this->setKeyType('string');
    }
}

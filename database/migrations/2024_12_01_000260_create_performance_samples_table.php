<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_samples', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('channel'); // api or web
            $table->string('path');
            $table->unsignedInteger('duration_ms');
            $table->timestamp('recorded_at');

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->index(['organization_id', 'channel', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_samples');
    }
};

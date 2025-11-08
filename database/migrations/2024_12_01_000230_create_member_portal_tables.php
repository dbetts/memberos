<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_goal_entries', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('member_id');
            $table->string('type'); // goal, checkin, streak
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('target_date')->nullable();
            $table->boolean('completed')->default(false);
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
        });

        Schema::create('member_device_tokens', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('member_id');
            $table->string('device');
            $table->string('token');
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_device_tokens');
        Schema::dropIfExists('member_goal_entries');
    }
};

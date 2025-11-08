<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waitlist_entries', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('class_session_id');
            $table->uuid('member_id')->nullable();
            $table->uuid('lead_id')->nullable();
            $table->unsignedSmallInteger('position')->default(1);
            $table->string('status')->default('waiting'); // waiting, promoted, skipped, canceled
            $table->timestamp('promoted_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('class_session_id')->references('id')->on('class_sessions')->cascadeOnDelete();
            $table->foreign('member_id')->references('id')->on('members')->nullOnDelete();
            $table->foreign('lead_id')->references('id')->on('leads')->nullOnDelete();
            $table->index(['organization_id', 'class_session_id', 'status']);
        });

        Schema::create('booking_confirmations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('booking_id');
            $table->string('channel')->default('sms');
            $table->string('token')->unique();
            $table->timestamp('expires_at');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();

            $table->foreign('booking_id')->references('id')->on('bookings')->cascadeOnDelete();
        });

        Schema::create('cadences', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('channel')->default('sms');
            $table->unsignedSmallInteger('steps_count')->default(0);
            $table->boolean('is_default')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->index(['organization_id', 'channel']);
        });

        Schema::create('cadence_steps', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('cadence_id');
            $table->unsignedSmallInteger('step_order');
            $table->string('channel')->default('sms');
            $table->uuid('message_template_id')->nullable();
            $table->unsignedInteger('delay_minutes')->default(0);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('cadence_id')->references('id')->on('cadences')->cascadeOnDelete();
            $table->foreign('message_template_id')->references('id')->on('message_templates')->nullOnDelete();
            $table->unique(['cadence_id', 'step_order']);
        });

        Schema::create('lead_tasks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('lead_id');
            $table->uuid('cadence_step_id')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->string('type')->default('call');
            $table->text('notes')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('status')->default('open'); // open, completed, skipped
            $table->timestamps();

            $table->foreign('lead_id')->references('id')->on('leads')->cascadeOnDelete();
            $table->foreign('cadence_step_id')->references('id')->on('cadence_steps')->nullOnDelete();
            $table->index(['lead_id', 'status']);
        });

        Schema::create('lead_stage_logs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('lead_id');
            $table->string('from_stage')->nullable();
            $table->string('to_stage');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('changed_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('lead_id')->references('id')->on('leads')->cascadeOnDelete();
        });

        Schema::table('leads', function (Blueprint $table): void {
            $table->uuid('cadence_id')->nullable()->after('stage');
            $table->timestamp('cadence_started_at')->nullable()->after('cadence_id');
            $table->foreign('cadence_id')->references('id')->on('cadences')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table): void {
            $table->dropForeign(['cadence_id']);
            $table->dropColumn(['cadence_id', 'cadence_started_at']);
        });
        Schema::dropIfExists('lead_stage_logs');
        Schema::dropIfExists('lead_tasks');
        Schema::dropIfExists('cadence_steps');
        Schema::dropIfExists('cadences');
        Schema::dropIfExists('booking_confirmations');
        Schema::dropIfExists('waitlist_entries');
    }
};

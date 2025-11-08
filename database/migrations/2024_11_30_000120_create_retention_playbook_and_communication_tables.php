<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('retention_settings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('key');
            $table->json('value');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['organization_id', 'key']);
        });

        Schema::create('message_templates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('channel'); // email or sms
            $table->string('name');
            $table->string('slug')->nullable();
            $table->string('subject')->nullable();
            $table->longText('content_html')->nullable();
            $table->longText('content_text')->nullable();
            $table->longText('editor_state')->nullable();
            $table->json('variables')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('requires_review')->default(false);
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['organization_id', 'slug']);
            $table->index(['organization_id', 'channel']);
        });

        Schema::create('playbooks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->string('status')->default('draft'); // draft, active, paused
            $table->string('trigger_type');
            $table->json('trigger_config')->nullable();
            $table->json('audience_filter')->nullable();
            $table->json('channel_strategy')->nullable();
            $table->json('throttle_rules')->nullable();
            $table->json('quiet_hours')->nullable();
            $table->uuid('primary_template_id')->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('paused_at')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('primary_template_id')->references('id')->on('message_templates')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->index(['organization_id', 'status']);
        });

        Schema::create('messages', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('member_id')->nullable();
            $table->uuid('lead_id')->nullable();
            $table->uuid('message_template_id')->nullable();
            $table->uuid('playbook_id')->nullable();
            $table->string('channel');
            $table->string('subject')->nullable();
            $table->longText('body_html')->nullable();
            $table->longText('body_text')->nullable();
            $table->string('status')->default('queued');
            $table->json('delivery_meta')->nullable();
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->string('error_code')->nullable();
            $table->text('error_message')->nullable();
            $table->json('metrics')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('member_id')->references('id')->on('members')->nullOnDelete();
            $table->foreign('lead_id')->references('id')->on('leads')->nullOnDelete();
            $table->foreign('message_template_id')->references('id')->on('message_templates')->nullOnDelete();
            $table->foreign('playbook_id')->references('id')->on('playbooks')->nullOnDelete();
            $table->index(['organization_id', 'channel', 'status']);
        });

        Schema::create('communication_policies', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->time('quiet_hours_start')->default('21:00:00');
            $table->time('quiet_hours_end')->default('08:00:00');
            $table->unsignedSmallInteger('default_daily_cap')->default(3);
            $table->unsignedSmallInteger('default_weekly_cap')->default(12);
            $table->string('timezone_strategy')->default('member_preference');
            $table->boolean('enforce_stop_keywords')->default(true);
            $table->json('metadata')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
            $table->unique('organization_id');
        });

        Schema::create('communication_opt_outs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('member_id')->nullable();
            $table->uuid('lead_id')->nullable();
            $table->string('channel');
            $table->string('keyword')->nullable();
            $table->timestamp('received_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('member_id')->references('id')->on('members')->nullOnDelete();
            $table->foreign('lead_id')->references('id')->on('leads')->nullOnDelete();
            $table->index(['organization_id', 'channel']);
        });

        Schema::create('member_communication_stats', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('member_id');
            $table->date('bucket_date');
            $table->unsignedSmallInteger('queued_count')->default(0);
            $table->unsignedSmallInteger('sent_count')->default(0);
            $table->unsignedSmallInteger('delivered_count')->default(0);
            $table->unsignedSmallInteger('failed_count')->default(0);
            $table->timestamps();

            $table->foreign('member_id')->references('id')->on('members')->cascadeOnDelete();
            $table->unique(['member_id', 'bucket_date']);
        });

        Schema::create('playbook_versions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('playbook_id');
            $table->unsignedInteger('version');
            $table->json('definition');
            $table->text('change_summary')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('playbook_id')->references('id')->on('playbooks')->cascadeOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
            $table->unique(['playbook_id', 'version']);
        });

        Schema::create('playbook_executions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('playbook_id');
            $table->uuid('playbook_version_id');
            $table->uuid('organization_id');
            $table->uuid('member_id')->nullable();
            $table->uuid('lead_id')->nullable();
            $table->uuid('message_id')->nullable();
            $table->string('status')->default('pending'); // pending, skipped, sent, failed
            $table->json('context')->nullable();
            $table->json('outcome')->nullable();
            $table->timestamp('triggered_at');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->foreign('playbook_id')->references('id')->on('playbooks')->cascadeOnDelete();
            $table->foreign('playbook_version_id')->references('id')->on('playbook_versions')->cascadeOnDelete();
            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->foreign('member_id')->references('id')->on('members')->nullOnDelete();
            $table->foreign('lead_id')->references('id')->on('leads')->nullOnDelete();
            $table->foreign('message_id')->references('id')->on('messages')->nullOnDelete();
            $table->index(['organization_id', 'status']);
            $table->index(['playbook_id', 'triggered_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('playbook_executions');
        Schema::dropIfExists('playbook_versions');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('playbooks');
        Schema::dropIfExists('member_communication_stats');
        Schema::dropIfExists('communication_opt_outs');
        Schema::dropIfExists('communication_policies');
        Schema::dropIfExists('message_templates');
        Schema::dropIfExists('retention_settings');
    }
};

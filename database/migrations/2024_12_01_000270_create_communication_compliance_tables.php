<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('communication_domains', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('domain');
            $table->string('status')->default('pending');
            $table->text('spf_record')->nullable();
            $table->string('dkim_selector')->nullable();
            $table->text('dkim_value')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
            $table->unique(['organization_id', 'domain']);
        });

        Schema::create('sms_registrations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('brand_name');
            $table->string('campaign_name');
            $table->json('metadata')->nullable();
            $table->string('status')->default('draft');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_registrations');
        Schema::dropIfExists('communication_domains');
    }
};

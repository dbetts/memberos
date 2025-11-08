<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table): void {
            $table->string('subdomain')->nullable()->unique();
            $table->string('custom_domain')->nullable()->unique();
            $table->string('support_email')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('primary_color')->default('#4b79ff');
            $table->string('accent_color')->default('#2f63ff');
            $table->json('smtp_settings')->nullable();
            $table->json('branding_overrides')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table): void {
            $table->dropColumn([
                'subdomain',
                'custom_domain',
                'support_email',
                'logo_path',
                'primary_color',
                'accent_color',
                'smtp_settings',
                'branding_overrides',
            ]);
        });
    }
};

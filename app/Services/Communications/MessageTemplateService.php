<?php

namespace App\Services\Communications;

use App\Models\MessageTemplate;
use App\Models\Organization;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;

class MessageTemplateService
{
    public function listForOrganization(Organization $organization, array $filters = [])
    {
        $query = MessageTemplate::query()
            ->where('organization_id', $organization->id)
            ->orderBy('name');

        if ($channel = Arr::get($filters, 'channel')) {
            $query->where('channel', $channel);
        }

        if (! Arr::get($filters, 'include_archived')) {
            $query->whereNull('archived_at');
        }

        return $query->get();
    }

    public function createTemplate(Organization $organization, array $payload): MessageTemplate
    {
        return MessageTemplate::create([
            'organization_id' => $organization->id,
            'channel' => Arr::get($payload, 'channel'),
            'name' => Arr::get($payload, 'name'),
            'slug' => Arr::get($payload, 'slug') ?? Str::slug(Arr::get($payload, 'name')), 
            'subject' => Arr::get($payload, 'subject'),
            'content_html' => Arr::get($payload, 'content_html'),
            'content_text' => Arr::get($payload, 'content_text'),
            'editor_state' => Arr::get($payload, 'editor_state'),
            'variables' => Arr::get($payload, 'variables', []),
            'is_default' => Arr::get($payload, 'is_default', false),
            'requires_review' => Arr::get($payload, 'requires_review', false),
            'created_by' => Arr::get($payload, 'created_by'),
            'updated_by' => Arr::get($payload, 'created_by'),
        ]);
    }

    public function updateTemplate(MessageTemplate $template, array $payload): MessageTemplate
    {
        $template->fill(Arr::only($payload, [
            'name',
            'subject',
            'content_html',
            'content_text',
            'editor_state',
            'variables',
            'is_default',
            'requires_review',
        ]));

        if (Arr::has($payload, 'updated_by')) {
            $template->updated_by = Arr::get($payload, 'updated_by');
        }

        if (Arr::get($payload, 'archived', false)) {
            $template->archived_at = now();
        }

        $template->save();

        return $template;
    }

    public function restore(MessageTemplate $template): MessageTemplate
    {
        $template->archived_at = null;
        $template->save();

        return $template;
    }
}

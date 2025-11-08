<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use App\Services\Communications\MessageTemplateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MessageTemplateController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly MessageTemplateService $templateService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $templates = $this->templateService->listForOrganization($organization, $request->only(['channel', 'include_archived']));

        return response()->json(['data' => $templates]);
    }

    public function store(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $this->validatePayload($request);

        $template = $this->templateService->createTemplate($organization, $data + [
            'created_by' => optional($request->user())->id,
        ]);

        return response()->json(['data' => $template], 201);
    }

    public function show(Request $request, MessageTemplate $template): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($template->organization_id === $organization->id, 404);

        return response()->json(['data' => $template]);
    }

    public function update(Request $request, MessageTemplate $template): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($template->organization_id === $organization->id, 404);

        $data = $this->validatePayload($request, $template);
        $template = $this->templateService->updateTemplate($template, $data + [
            'updated_by' => optional($request->user())->id,
        ]);

        return response()->json(['data' => $template]);
    }

    public function destroy(Request $request, MessageTemplate $template): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($template->organization_id === $organization->id, 404);

        $template->archived_at = now();
        $template->updated_by = optional($request->user())->id;
        $template->save();

        return response()->json([], 204);
    }

    public function restore(Request $request, MessageTemplate $template): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($template->organization_id === $organization->id, 404);

        $template = $this->templateService->restore($template);

        return response()->json(['data' => $template]);
    }

    protected function validatePayload(Request $request, ?MessageTemplate $template = null): array
    {
        return $request->validate([
            'channel' => [$template ? 'sometimes' : 'required', Rule::in(['sms', 'email'])],
            'name' => [$template ? 'sometimes' : 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string'],
            'subject' => ['nullable', 'string', 'max:160'],
            'content_html' => ['nullable', 'string'],
            'content_text' => ['nullable', 'string'],
            'editor_state' => ['nullable'],
            'variables' => ['nullable', 'array'],
            'is_default' => ['nullable', 'boolean'],
            'requires_review' => ['nullable', 'boolean'],
            'archived' => ['nullable', 'boolean'],
        ]);
    }
}

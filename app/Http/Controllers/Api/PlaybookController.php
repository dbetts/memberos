<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Playbook;
use App\Services\Retention\PlaybookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlaybookController extends Controller
{
    use ResolvesOrganization;

    public function __construct(private readonly PlaybookService $playbookService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $playbooks = $this->playbookService->list($organization);

        return response()->json(['data' => $playbooks]);
    }

    public function store(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $this->validatePayload($request);

        $playbook = $this->playbookService->create($organization, $data, optional($request->user())->id);

        return response()->json(['data' => $playbook], 201);
    }

    public function show(Request $request, Playbook $playbook): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($playbook->organization_id === $organization->id, 404);

        $playbook->load(['primaryTemplate', 'versions' => fn ($q) => $q->orderByDesc('version')]);

        return response()->json(['data' => $playbook]);
    }

    public function update(Request $request, Playbook $playbook): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($playbook->organization_id === $organization->id, 404);

        $data = $this->validatePayload($request);
        $playbook = $this->playbookService->update($playbook, $data, optional($request->user())->id);

        return response()->json(['data' => $playbook]);
    }

    public function destroy(Request $request, Playbook $playbook): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($playbook->organization_id === $organization->id, 404);

        $this->playbookService->archive($playbook, optional($request->user())->id);

        return response()->json([], 204);
    }

    public function activate(Request $request, Playbook $playbook): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($playbook->organization_id === $organization->id, 404);

        $playbook = $this->playbookService->activate($playbook, optional($request->user())->id);

        return response()->json(['data' => $playbook]);
    }

    public function pause(Request $request, Playbook $playbook): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($playbook->organization_id === $organization->id, 404);

        $playbook = $this->playbookService->pause($playbook, optional($request->user())->id);

        return response()->json(['data' => $playbook]);
    }

    protected function validatePayload(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trigger_type' => ['required', 'string'],
            'trigger_config' => ['nullable', 'array'],
            'audience_filter' => ['nullable', 'array'],
            'channel_strategy' => ['nullable', 'array'],
            'throttle_rules' => ['nullable', 'array'],
            'quiet_hours' => ['nullable', 'array'],
            'primary_template_id' => ['nullable', 'uuid'],
            'description' => ['nullable', 'string'],
            'change_summary' => ['nullable', 'string'],
        ]);
    }
}

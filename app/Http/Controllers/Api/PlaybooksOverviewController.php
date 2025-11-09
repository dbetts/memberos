<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Services\Communications\MessageTemplateService;
use App\Services\Retention\PlaybookService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlaybooksOverviewController extends Controller
{
    use ResolvesOrganization;

    public function __construct(
        private readonly PlaybookService $playbookService,
        private readonly MessageTemplateService $templateService,
    ) {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $playbooks = $this->playbookService->list($organization);
        $templates = $this->templateService->listForOrganization($organization, $request->only(['channel', 'include_archived']));

        return response()->json([
            'data' => [
                'playbooks' => $playbooks,
                'templates' => $templates,
            ],
        ]);
    }
}

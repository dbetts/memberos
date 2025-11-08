<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadTask;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadTaskController extends Controller
{
    use ResolvesOrganization;

    public function store(Request $request, Lead $lead): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($lead->organization_id === $organization->id, 404);

        $data = $request->validate([
            'type' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
            'due_at' => ['nullable', 'date'],
        ]);

        $task = LeadTask::create(array_merge($data, [
            'lead_id' => $lead->id,
            'status' => 'open',
        ]));

        return response()->json(['data' => $task], 201);
    }

    public function update(Request $request, LeadTask $task): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($task->lead->organization_id === $organization->id, 404);

        $data = $request->validate([
            'status' => ['required', 'in:open,completed,skipped'],
            'notes' => ['nullable', 'string'],
        ]);

        $task->fill($data);
        if ($data['status'] === 'completed') {
            $task->completed_at = now();
        }
        $task->save();

        return response()->json(['data' => $task]);
    }
}

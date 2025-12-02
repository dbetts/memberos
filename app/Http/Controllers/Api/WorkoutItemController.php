<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Exercise;
use App\Models\WorkoutItem;
use App\Models\WorkoutSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WorkoutItemController extends Controller
{
    use ResolvesOrganization;

    public function show(Request $request, WorkoutItem $item): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($item->organization_id === $organization->id, 404);

        return response()->json(['data' => $item]);
    }

    public function store(Request $request, WorkoutSession $session): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($session->organization_id === $organization->id, 404);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'block' => ['nullable', 'string', 'max:120'],
            'exercise_type' => ['nullable', 'string', 'max:50'],
            'measurement_type' => ['nullable', 'string', 'max:50'],
            'measurement' => ['nullable', 'array'],
            'measurements' => ['nullable', 'array'],
            'measurements.*.type' => ['required_with:measurements.*', 'string', 'max:50'],
            'measurements.*.data' => ['nullable', 'array'],
            'rest_seconds' => ['nullable', 'integer', 'min:0', 'max:3600'],
            'is_scored' => ['boolean'],
            'instructions' => ['nullable', 'string'],
            'coach_notes' => ['nullable', 'string'],
            'athlete_notes' => ['nullable', 'string'],
            'exercise_id' => ['nullable', 'uuid', 'exists:exercises,id'],
        ]);

        $position = ($session->items()->max('position') ?? -1) + 1;
        $exercise = null;
        if (! empty($data['exercise_id'])) {
            $exercise = Exercise::where('id', $data['exercise_id'])
                ->where(function ($q) use ($organization) {
                    $q->whereNull('organization_id')->orWhere('organization_id', $organization->id);
                })
                ->firstOrFail();
        }

        $measurements = $this->prepareMeasurements($data);
        $primaryMeasurement = $measurements[0] ?? null;

        $item = WorkoutItem::create([
            'workout_session_id' => $session->id,
            'organization_id' => $organization->id,
            'title' => $data['title'] ?? ($exercise?->name ?? 'Workout'),
            'block' => $data['block'] ?? 'Workout',
            'exercise_id' => $exercise?->id,
            'exercise_type' => $data['exercise_type'] ?? null,
            'measurement_type' => $primaryMeasurement['type'] ?? ($data['measurement_type'] ?? null),
            'measurement' => $measurements ?: ($data['measurement'] ?? null),
            'rest_seconds' => $data['rest_seconds'] ?? null,
            'is_scored' => $data['is_scored'] ?? false,
            'instructions' => $data['instructions'] ?? null,
            'coach_notes' => $data['coach_notes'] ?? null,
            'athlete_notes' => $data['athlete_notes'] ?? null,
            'position' => $position,
        ]);

        return response()->json(['data' => $item], 201);
    }

    public function update(Request $request, WorkoutItem $item): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($item->organization_id === $organization->id, 404);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'block' => ['sometimes', 'string', 'max:120'],
            'exercise_type' => ['sometimes', 'string', 'max:50'],
            'measurement_type' => ['sometimes', 'string', 'max:50'],
            'measurement' => ['sometimes', 'array'],
            'measurements' => ['nullable', 'array'],
            'measurements.*.type' => ['required_with:measurements.*', 'string', 'max:50'],
            'measurements.*.data' => ['nullable', 'array'],
            'rest_seconds' => ['nullable', 'integer', 'min:0', 'max:3600'],
            'is_scored' => ['boolean'],
            'instructions' => ['nullable', 'string'],
            'coach_notes' => ['nullable', 'string'],
            'athlete_notes' => ['nullable', 'string'],
            'exercise_id' => ['nullable', 'uuid', 'exists:exercises,id'],
        ]);

        if (! empty($data['exercise_id'])) {
            $exercise = Exercise::where('id', $data['exercise_id'])
                ->where(function ($q) use ($organization) {
                    $q->whereNull('organization_id')->orWhere('organization_id', $organization->id);
                })
                ->firstOrFail();
            $item->exercise_id = $exercise->id;
            $item->title = $item->title ?? $exercise->name;
        }

        if (array_key_exists('measurements', $data)) {
            $measurements = $this->prepareMeasurements($data);
            $item->measurement_type = $measurements[0]['type'] ?? ($data['measurement_type'] ?? $item->measurement_type);
            $item->measurement = $measurements ?: ($data['measurement'] ?? $item->measurement);
        }

        $item->fill($data);
        $item->save();

        return response()->json(['data' => $item]);
    }

    public function destroy(Request $request, WorkoutItem $item): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($item->organization_id === $organization->id, 404);

        $item->delete();

        return response()->json(['status' => 'ok']);
    }

    public function move(Request $request, WorkoutItem $item): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($item->organization_id === $organization->id, 404);

        $data = $request->validate([
            'session_id' => ['required', 'uuid'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $session = WorkoutSession::where('id', $data['session_id'])
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        $item->workout_session_id = $session->id;
        $item->position = $data['position'] ?? ($session->items()->max('position') ?? -1) + 1;
        $item->save();

        return response()->json(['data' => $item]);
    }

    public function duplicate(Request $request, WorkoutItem $item): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($item->organization_id === $organization->id, 404);

        $session = $item->session;
        $position = ($session->items()->max('position') ?? -1) + 1;

        $clone = $item->replicate();
        $clone->id = (string) Str::uuid();
        $clone->position = $position;
        $clone->title = $clone->title . ' (copy)';
        $clone->save();

        return response()->json(['data' => $clone], 201);
    }

    protected function prepareMeasurements(array $data): array
    {
        $rows = [];

        if (! empty($data['measurements']) && is_array($data['measurements'])) {
            foreach ($data['measurements'] as $entry) {
                $type = trim((string) ($entry['type'] ?? ''));
                if ($type === '') {
                    continue;
                }

                $rows[] = [
                    'type' => $type,
                    'data' => isset($entry['data']) && is_array($entry['data']) ? $entry['data'] : [],
                ];
            }
        }

        if (empty($rows) && ! empty($data['measurement_type'])) {
            $rows[] = [
                'type' => $data['measurement_type'],
                'data' => $data['measurement'] ?? [],
            ];
        }

        return $rows;
    }
}

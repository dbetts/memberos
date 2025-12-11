<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Exercise;
use App\Models\Workout;
use App\Models\WorkoutItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class WorkoutItemController extends Controller
{
    private const METRIC_OPTIONS = [
        'load',
        'rpe',
        'one_rm_percent',
        'rir',
        'time',
        'rounds_reps',
        'reps',
        'calories',
        'meters',
    ];
    private const VISIBILITY_OPTIONS = ['everyone', 'coaches', 'programmers'];

    use ResolvesOrganization;

    public function show(Request $request, WorkoutItem $item): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $item->loadMissing('workout');
        abort_unless(optional($item->workout)->organization_id === $organization->id, 404);

        return response()->json(['data' => $item]);
    }

    public function store(Request $request, Workout $workout): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($workout->organization_id === $organization->id, 404);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
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
            'reps' => ['nullable', 'array'],
            'reps.*.set' => ['nullable', 'integer', 'min:1', 'max:100'],
            'reps.*.reps' => ['nullable', 'integer', 'min:0', 'max:2000'],
            'reps.*.prescription' => ['nullable', 'string', 'max:120'],
            'metric' => ['nullable', Rule::in(self::METRIC_OPTIONS)],
            'visible_to' => ['nullable', Rule::in(self::VISIBILITY_OPTIONS)],
        ]);

        $position = ($workout->items()->max('position') ?? -1) + 1;
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
        $repsPayload = $this->normalizeStrengthSets($data['reps'] ?? null);

        $item = WorkoutItem::create([
            'workout_id' => $workout->id,
            'title' => $data['title'] ?? ($exercise?->name ?? 'Workout'),
            'exercise_id' => $exercise?->id,
            'exercise_type' => $data['exercise_type'] ?? null,
            'reps' => $repsPayload,
            'metric' => $data['metric'] ?? null,
            'visible_to' => $data['visible_to'] ?? 'everyone',
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
        $item->loadMissing('workout');
        abort_unless(optional($item->workout)->organization_id === $organization->id, 404);

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
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
            'reps' => ['nullable', 'array'],
            'reps.*.set' => ['nullable', 'integer', 'min:1', 'max:100'],
            'reps.*.reps' => ['nullable', 'integer', 'min:0', 'max:2000'],
            'reps.*.prescription' => ['nullable', 'string', 'max:120'],
            'metric' => ['nullable', Rule::in(self::METRIC_OPTIONS)],
            'visible_to' => ['nullable', Rule::in(self::VISIBILITY_OPTIONS)],
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

        if (array_key_exists('reps', $data)) {
            $item->reps = $this->normalizeStrengthSets($data['reps']);
            unset($data['reps']);
        }

        $item->fill($data);
        $item->save();

        return response()->json(['data' => $item]);
    }

    public function destroy(Request $request, WorkoutItem $item): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $item->loadMissing('workout');
        abort_unless(optional($item->workout)->organization_id === $organization->id, 404);

        $item->delete();

        return response()->json(['status' => 'ok']);
    }

    public function move(Request $request, WorkoutItem $item): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $item->loadMissing('workout');
        abort_unless(optional($item->workout)->organization_id === $organization->id, 404);

        $data = $request->validate([
            'workout_id' => ['nullable', 'uuid'],
            'session_id' => ['nullable', 'uuid'],
            'position' => ['nullable', 'integer', 'min:0'],
        ]);

        $targetWorkoutId = $data['workout_id'] ?? $data['session_id'] ?? null;
        abort_unless($targetWorkoutId !== null, 422, 'A workout_id is required.');

        $workout = Workout::where('id', $targetWorkoutId)
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        $item->workout_id = $workout->id;
        $item->position = $data['position'] ?? ($workout->items()->max('position') ?? -1) + 1;
        $item->save();

        return response()->json(['data' => $item]);
    }

    public function duplicate(Request $request, WorkoutItem $item): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $item->loadMissing('workout');
        abort_unless(optional($item->workout)->organization_id === $organization->id, 404);

        $workout = $item->workout;
        $position = ($workout->items()->max('position') ?? -1) + 1;

        $clone = $item->replicate();
        $clone->id = (string) Str::uuid();
        $clone->position = $position;
        $clone->title = $clone->title . ' (copy)';
        $clone->save();

        return response()->json(['data' => $clone], 201);
    }

    protected function normalizeStrengthSets(?array $rows): ?array
    {
        if (empty($rows) || ! is_array($rows)) {
            return null;
        }

        $normalized = [];

        foreach ($rows as $index => $row) {
            if (! is_array($row)) {
                continue;
            }

            $setNumber = isset($row['set']) ? max(1, (int) $row['set']) : $index + 1;
            $reps = array_key_exists('reps', $row)
                ? ($row['reps'] === null || $row['reps'] === '' ? null : (int) $row['reps'])
                : null;
            $prescription = isset($row['prescription']) && $row['prescription'] !== ''
                ? trim((string) $row['prescription'])
                : null;

            $normalized[] = [
                'set' => $setNumber,
                'reps' => $reps,
                'prescription' => $prescription,
            ];
        }

        return $normalized ?: null;
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

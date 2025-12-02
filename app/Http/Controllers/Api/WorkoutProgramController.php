<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\WorkoutProgram;
use App\Models\WorkoutSession;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkoutProgramController extends Controller
{
    use ResolvesOrganization;

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $programs = WorkoutProgram::query()
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name', 'color', 'description', 'is_active']);

        return response()->json(['data' => $programs]);
    }

    public function store(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:20'],
        ]);

        $program = WorkoutProgram::create([
            'organization_id' => $organization->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'color' => $data['color'] ?? null,
        ]);

        return response()->json(['data' => $program], 201);
    }

    public function calendar(Request $request, WorkoutProgram $program): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        abort_unless($program->organization_id === $organization->id, 404);

        $start = $request->query('start_date')
            ? CarbonImmutable::parse($request->query('start_date'))
            : CarbonImmutable::now($organization->primary_timezone ?? 'UTC')->startOfWeek();

        $days = [];
        for ($i = 0; $i < 7; $i++) {
            $days[] = $start->addDays($i);
        }

        $sessions = WorkoutSession::query()
            ->with('items')
            ->where('workout_program_id', $program->id)
            ->whereBetween('scheduled_for', [$days[0]->toDateString(), end($days)->toDateString()])
            ->get()
            ->keyBy(fn ($session) => $session->scheduled_for?->toDateString());

        $responseDays = [];
        foreach ($days as $index => $day) {
            $formatted = $day->toDateString();
            $session = $sessions->get($formatted);

            if (! $session) {
                $session = WorkoutSession::create([
                    'workout_program_id' => $program->id,
                    'organization_id' => $organization->id,
                    'scheduled_for' => $formatted,
                    'label' => null,
                    'position' => $index,
                ]);
            }

            $cards = $session->items
                ->sortBy('position')
                ->values()
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'block' => $item->block,
                    'description' => $item->instructions,
                    'instructions' => $item->instructions,
                    'coach_notes' => $item->coach_notes,
                    'athlete_notes' => $item->athlete_notes,
                    'exercise_id' => $item->exercise_id,
                    'exercise_type' => $item->exercise_type,
                    'measurement_type' => $item->measurement_type,
                    'measurement' => $item->measurement,
                    'measurements' => is_array($item->measurement)
                        ? array_values($item->measurement)
                        : ($item->measurement_type
                            ? [[
                                'type' => $item->measurement_type,
                                'data' => $item->measurement ?? [],
                            ]]
                            : []),
                    'rest_seconds' => $item->rest_seconds,
                    'is_scored' => (bool) $item->is_scored,
                    'color' => $item->color,
                ]);

            $responseDays[] = [
                'session_id' => $session->id,
                'date' => $formatted,
                'label' => $session->label,
                'cards' => $cards,
            ];
        }

        return response()->json([
            'data' => [
                'program' => $program->only(['id', 'name', 'color', 'description']),
                'days' => $responseDays,
            ],
        ]);
    }
}

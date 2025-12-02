<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\Exercise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ExerciseController extends Controller
{
    use ResolvesOrganization;

    public function index(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $search = trim((string) $request->query('search'));

        $query = Exercise::query()
            ->where(function ($query) use ($organization): void {
                $query->whereNull('organization_id')
                    ->orWhere('organization_id', $organization->id);
            });

        if ($search !== '') {
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('category', 'ilike', "%{$search}%")
                    ->orWhere('modality', 'ilike', "%{$search}%");
            });
        }

        $exercises = $query
            ->orderByRaw("CASE WHEN organization_id IS NULL THEN 0 ELSE 1 END")
            ->orderBy('type')
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(function (Exercise $exercise) {
                return [
                    'id' => $exercise->id,
                    'name' => $exercise->name,
                    'type' => $exercise->type,
                    'category' => $exercise->category,
                    'modality' => $exercise->modality,
                    'is_public' => $exercise->organization_id === null,
                ];
            });

        return response()->json(['data' => $exercises]);
    }

    public function store(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:100'],
            'modality' => ['nullable', 'string', 'max:100'],
        ]);

        $slug = Str::slug($data['name']);

        $exercise = Exercise::create([
            'organization_id' => $organization->id,
            'name' => $data['name'],
            'slug' => $slug,
            'type' => $data['type'] ?? null,
            'category' => $data['category'] ?? null,
            'modality' => $data['modality'] ?? null,
            'is_public' => false,
        ]);

        return response()->json(['data' => $exercise], 201);
    }
}

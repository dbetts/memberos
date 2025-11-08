<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\DataImportBatch;
use App\Models\Member;
use App\Models\MemberAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MemberImportController extends Controller
{
    use ResolvesOrganization;

    public function store(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);

        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt'],
        ]);

        $path = $request->file('file')->store('imports');

        $handle = fopen(Storage::path($path), 'r');
        $header = null;
        $processed = 0;
        $created = 0;
        $credentials = [];

        while (($row = fgetcsv($handle, 0, ',')) !== false) {
            if ($header === null) {
                $header = array_map(fn ($value) => strtolower(trim($value)), $row);
                continue;
            }

            $record = array_combine($header, $row);
            if (! $record || empty($record['first_name']) || empty($record['last_name'])) {
                continue;
            }

            $processed++;

            $member = Member::create([
                'organization_id' => $organization->id,
                'first_name' => $record['first_name'],
                'last_name' => $record['last_name'],
                'status' => $record['status'] ?? 'active',
                'timezone' => $record['timezone'] ?? $organization->primary_timezone,
                'email_encrypted' => isset($record['email']) && $record['email'] !== '' ? encrypt($record['email']) : null,
                'email_hash' => isset($record['email']) && $record['email'] !== '' ? hash('sha256', strtolower($record['email'])) : null,
                'phone_encrypted' => isset($record['phone']) && $record['phone'] !== '' ? encrypt($record['phone']) : null,
                'phone_hash' => isset($record['phone']) && $record['phone'] !== '' ? hash('sha256', preg_replace('/[^\\d+]/', '', $record['phone'])) : null,
                'metadata' => ['source' => 'csv_import'],
            ]);

            $created++;

            if (! empty($record['email'])) {
                $email = strtolower($record['email']);
                if (! MemberAccount::where('email', $email)->exists()) {
                    $password = Str::password(10);
                    MemberAccount::create([
                        'member_id' => $member->id,
                        'email' => $email,
                        'password' => $password,
                    ]);
                    $credentials[] = [
                        'member' => "{$member->first_name} {$member->last_name}",
                        'email' => $email,
                        'temp_password' => $password,
                    ];
                }
            }
        }

        fclose($handle);

        DataImportBatch::create([
            'organization_id' => $organization->id,
            'source' => 'portal_upload',
            'import_type' => 'members',
            'status' => 'completed',
            'storage_path' => $path,
            'summary' => [
                'processed' => $processed,
                'created' => $created,
            ],
            'initiated_by' => optional($request->user())->id,
            'started_at' => now(),
            'completed_at' => now(),
        ]);

        return response()->json([
            'data' => [
                'processed' => $processed,
                'created' => $created,
                'credentials' => $credentials,
            ],
        ]);
    }
}

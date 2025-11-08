<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesOrganization;
use App\Http\Controllers\Controller;
use App\Models\CommunicationDomain;
use App\Models\SmsRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommunicationComplianceController extends Controller
{
    use ResolvesOrganization;

    public function domains(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $domains = CommunicationDomain::where('organization_id', $organization->id)->get();

        return response()->json(['data' => $domains]);
    }

    public function storeDomain(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'domain' => ['required', 'string'],
            'spf_record' => ['nullable', 'string'],
            'dkim_selector' => ['nullable', 'string'],
            'dkim_value' => ['nullable', 'string'],
        ]);

        $domain = CommunicationDomain::create(array_merge($data, [
            'organization_id' => $organization->id,
            'status' => 'pending',
        ]));

        return response()->json(['data' => $domain], 201);
    }

    public function smsRegistrations(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $registrations = SmsRegistration::where('organization_id', $organization->id)->get();

        return response()->json(['data' => $registrations]);
    }

    public function storeSmsRegistration(Request $request): JsonResponse
    {
        $organization = $this->resolveOrganization($request);
        $data = $request->validate([
            'brand_name' => ['required', 'string'],
            'campaign_name' => ['required', 'string'],
            'metadata' => ['nullable', 'array'],
        ]);

        $registration = SmsRegistration::create(array_merge($data, [
            'organization_id' => $organization->id,
            'status' => 'draft',
        ]));

        return response()->json(['data' => $registration], 201);
    }
}

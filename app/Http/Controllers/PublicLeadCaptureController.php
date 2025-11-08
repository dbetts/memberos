<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PublicLeadCaptureController extends Controller
{
    public function form(): View
    {
        return view('lead-capture');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string'],
            'last_name' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'phone' => ['nullable', 'string'],
            'source' => ['nullable', 'string'],
            'preferred_location_id' => ['nullable', 'uuid'],
        ]);

        $organizationId = config('app.default_organization_id') ?? \App\Models\Organization::value('id');

        Lead::create([
            'organization_id' => $organizationId,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email_encrypted' => isset($data['email']) ? encrypt($data['email']) : null,
            'email_hash' => isset($data['email']) ? hash('sha256', strtolower($data['email'])) : null,
            'phone_encrypted' => isset($data['phone']) ? encrypt($data['phone']) : null,
            'phone_hash' => isset($data['phone']) ? hash('sha256', preg_replace('/[^\\d+]/', '', $data['phone'])) : null,
            'stage' => 'new',
            'source' => $data['source'] ?? 'public_form',
            'preferred_location_id' => $data['preferred_location_id'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Thanks! A team member will reach out shortly.');
    }
}

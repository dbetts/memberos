<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class MasterImpersonationController extends Controller
{
    public function start(Request $request): RedirectResponse
    {
        $master = $request->user();
        abort_unless($master && $master->is_master, 403);

        $data = $request->validate([
            'organization_id' => ['required', 'string'],
            'user_id' => ['nullable', Rule::exists('users', 'id')->where('organization_id', $request->input('organization_id'))],
        ]);

        $targetQuery = User::query()
            ->where('organization_id', $data['organization_id'])
            ->where('is_master', false);

        if (! empty($data['user_id'])) {
            $targetQuery->where('id', $data['user_id']);
        } else {
            $targetQuery->orderByRaw("CASE WHEN default_role = 'owner' THEN 0 ELSE 1 END")->orderBy('name');
        }

        $target = $targetQuery->first();

        abort_if(! $target, 404, 'No admin found for this workspace.');

        $request->session()->put('impersonated_by', $master->id);
        $request->session()->put('impersonating_org_id', $data['organization_id']);

        Auth::guard('web')->login($target);

        return redirect('/app');
    }

    public function stop(Request $request): RedirectResponse
    {
        $impersonatorId = $request->session()->pull('impersonated_by');
        $request->session()->forget('impersonating_org_id');

        abort_unless($impersonatorId, 403);

        Auth::guard('web')->loginUsingId($impersonatorId);
        $request->session()->regenerate();

        return redirect()->route('master.dashboard');
    }
}

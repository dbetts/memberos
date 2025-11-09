<?php

namespace App\Http\Controllers;

use App\Models\MemberAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class AdminAuthController extends Controller
{
    public function showLogin(Request $request): View|RedirectResponse
    {
        if (Auth::guard('web')->check()) {
            $user = $request->user();

            $redirect = $user?->is_master ? route('master.dashboard') : url('/app');

            return redirect()->intended($redirect);
        }

        return view('admin-login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember');

        if (Auth::guard('web')->attempt($credentials, $remember)) {
            $request->session()->regenerate();
            $user = $request->user();

            $redirect = $user->is_master ? route('master.dashboard') : url('/app');

            return redirect()->intended($redirect);
        }

        if (Auth::guard('member')->attempt($credentials, $remember)) {
            /** @var MemberAccount $account */
            $account = Auth::guard('member')->user();
            $account->forceFill(['last_login_at' => now()])->save();

            $request->session()->regenerate();

            return redirect()->intended('/member/portal');
        }

        return back()->withErrors([
            'email' => 'Invalid credentials provided.',
        ])->withInput($request->only('email'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }
}

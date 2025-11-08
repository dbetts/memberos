<?php

namespace App\Http\Controllers;

use App\Models\MemberAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

class MemberAuthController extends Controller
{
    public function showLogin(): View
    {
        return view('member-login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember');

        if (Auth::guard('member')->attempt($credentials, $remember)) {
            /** @var MemberAccount $account */
            $account = Auth::guard('member')->user();
            $account->forceFill(['last_login_at' => now()])->save();

            $request->session()->regenerate();

            return redirect()->intended('/member/portal');
        }

        return back()->withErrors([
            'email' => 'Invalid login credentials.',
        ])->withInput($request->only('email'));
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('member')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('member.login');
    }
}

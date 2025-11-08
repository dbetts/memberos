<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredToken = config('services.memberos.api_token');

        if (! $configuredToken) {
            return $next($request);
        }

        $provided = $request->bearerToken();

        if (! $provided || ! hash_equals($configuredToken, $provided)) {
            abort(401, 'Invalid API token.');
        }

        return $next($request);
    }
}

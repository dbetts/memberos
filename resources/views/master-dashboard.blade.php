<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>FitFlow Master Control</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family:'Inter',sans-serif; margin:0; min-height:100vh; background:#0b1023; color:#e2e8f0; }
        header { padding:1.5rem 2rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,.05); }
        .container { padding:2rem; max-width:1200px; margin:0 auto; }
        table { width:100%; border-collapse:collapse; margin-top:1rem; }
        th, td { text-align:left; padding:0.85rem; border-bottom:1px solid rgba(148,163,184,.15); font-size:0.9rem; }
        th { text-transform:uppercase; font-size:0.75rem; letter-spacing:.08em; color:#94a3b8; }
        tr:nth-child(even) { background:rgba(148,163,184,.03); }
        .card { background:rgba(15,23,42,.85); border:1px solid rgba(148,163,184,.15); border-radius:1.25rem; padding:1.5rem; box-shadow:0 25px 70px rgba(0,0,0,.55); margin-bottom:2rem; }
        .badge { padding:0.2rem 0.6rem; border-radius:999px; font-size:0.75rem; }
        .badge.live { background:rgba(34,197,94,.15); color:#bbf7d0; }
    </style>
</head>
<body>
    <header>
        <div>
            <p style="margin:0;font-size:.85rem;color:#94a3b8;">FitFlow Master Control</p>
            <h1 style="margin:.2rem 0 0;font-size:1.6rem;">Welcome, {{ $user->name ?? 'Controller' }}</h1>
        </div>
        <form method="POST" action="{{ route('admin.logout') }}">
            @csrf
            <button type="submit" style="background:none;border:1px solid rgba(148,163,184,.4);border-radius:.85rem;color:#e2e8f0;padding:.65rem 1.25rem;font-weight:600;cursor:pointer;">Logout</button>
        </form>
    </header>
    <main class="container">
        <div class="card">
            <h2 style="margin-top:0;">Active workspaces</h2>
            <table>
                <thead>
                    <tr>
                        <th>Organization</th>
                        <th>Domain</th>
                        <th>Members</th>
                        <th>Locations</th>
                        <th>Plans</th>
                        <th>Last payment ref</th>
                        <th>Created</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($organizations as $org)
                        <tr>
                            <td>
                                <div style="font-weight:600;">{{ $org['name'] }}</div>
                                <div style="color:#94a3b8;font-size:.8rem;">{{ $org['id'] }}</div>
                            </td>
                            <td>
                                <div>{{ $org['subdomain'] ? $org['subdomain'] . '.fitflow.app' : '—' }}</div>
                                <div style="color:#94a3b8;font-size:.8rem;">{{ $org['custom_domain'] ?? '' }}</div>
                            </td>
                            <td>{{ $org['members'] }}</td>
                            <td>{{ $org['locations'] }}</td>
                            <td>{{ $org['plans'] }}</td>
                            <td>{{ $org['last_payment'] ?? '—' }}</td>
                            <td>{{ optional($org['created_at'])->format('M d, Y') }}</td>
                            <td>
                                <form method="POST" action="{{ route('master.impersonate') }}">
                                    @csrf
                                    <input type="hidden" name="organization_id" value="{{ $org['id'] }}">
                                    <button type="submit" style="background:#2f63ff;border:none;border-radius:.7rem;padding:.45rem 1rem;font-size:.8rem;font-weight:600;color:#fff;cursor:pointer;">Impersonate</button>
                                </form>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="8" style="text-align:center;color:#94a3b8;">No workspaces provisioned yet.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </main>
</body>
</html>

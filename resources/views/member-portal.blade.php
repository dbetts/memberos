<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Member Portal</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
    <style>
        :root {
            --portal-primary: {{ $branding['primary_color'] ?? '#4b79ff' }};
            --portal-accent: {{ $branding['accent_color'] ?? '#2f63ff' }};
        }
        body { font-family: 'Inter', sans-serif; background: #020617; margin: 0; color: #e2e8f0; }
        .hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 3rem 1.5rem; }
        .card { width: 100%; max-width: 640px; background: rgba(15, 23, 42, 0.92); padding: 2rem; border-radius: 1.5rem; box-shadow: 0 40px 95px rgba(2, 6, 23, 0.6); backdrop-filter: blur(18px); border: 1px solid rgba(148,163,184,.2); }
        h1 { font-size: 2.5rem; margin-bottom: .5rem; }
        .grid { display: grid; gap: 1rem; }
        .grid-two { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
        .goal-form input, .goal-form textarea { width: 100%; background: rgba(15,23,42,0.5); border: 1px solid rgba(148,163,184,.2); color: #e2e8f0; padding: .75rem 1rem; border-radius: .75rem; margin-top: .5rem; }
        button { border: none; background: linear-gradient(90deg,var(--portal-primary),var(--portal-accent)); color: #0f172a; padding: .75rem 1.5rem; border-radius: .95rem; font-weight: 600; cursor: pointer; box-shadow: 0 20px 45px rgba(75,121,255,0.35); }
        .goal-entry { padding: 1rem; border-radius: .85rem; background: rgba(148, 163, 184, 0.08); border: 1px solid rgba(148,163,184,0.12); }
        .portal-header { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .logo { display:flex; align-items:center; gap:.75rem; }
        .logo img { width:48px; height:48px; border-radius:1rem; object-fit:contain; background:#fff; padding:.35rem; }
        .logo span { font-weight:600; font-size:1.2rem; }
    </style>
</head>
<body>
    <div class="hero">
        <div class="card">
            <div class="portal-header">
                <div class="logo">
                    @if($branding['logo_url'])
                        <img src="{{ $branding['logo_url'] }}" alt="Gym logo">
                    @endif
                    <span>{{ $branding['organization_name'] ?? 'Your Studio' }}</span>
                </div>
                <form method="POST" action="{{ route('member.logout') }}">
                    @csrf
                    <button type="submit" style="background: rgba(248,250,252,0.1); color:#e2e8f0; box-shadow:none; padding:.5rem 1rem;">Logout</button>
                </form>
            </div>
            <h1>Hi {{ optional($member)->first_name ?? 'there' }}</h1>
            <p>Here's what we've lined up for you this week.</p>

            <div class="grid grid-two" style="margin: 2rem 0;">
                <div>
                    <div class="text-sm" style="color:#94a3b8;">Next session</div>
                    <div class="text-xl" style="margin-top:.25rem;">{{ optional(optional($member)->booking)->session->class_type ?? 'Book any class' }}</div>
                    <div style="color:#94a3b8;">{{ optional(optional($member)->booking)->session?->starts_at?->timezone(optional($member)->timezone ?? 'America/Los_Angeles')->format('M d · h:ia') }}</div>
                </div>
                <div>
                    <div class="text-sm" style="color:#94a3b8;">Streak</div>
                    <div class="text-xl" style="margin-top:.25rem;">{{ optional($member)->metadata['streak_days'] ?? 0 }} days</div>
                    <div style="color:#94a3b8;">Keep it going!</div>
                </div>
            </div>

            @if(session('success'))
                <div style="margin-bottom:1rem; color:#4ade80;">{{ session('success') }}</div>
            @endif

            <form class="goal-form" method="POST" action="{{ url('/member/portal/goals') }}">
                @csrf
                <label>
                    Upcoming goal
                    <input name="title" placeholder="Hit 4 sessions this week" required />
                </label>
                <label>
                    Details
                    <textarea name="description" rows="3" placeholder="Add any details..."></textarea>
                </label>
                <label>
                    Target date
                    <input name="target_date" type="date" />
                </label>
                <div style="margin-top:1rem; text-align:right;">
                    <button type="submit">Save goal</button>
                </div>
            </form>

            <div style="margin-top:2rem;">
                <div style="font-weight:600; margin-bottom:.5rem;">Recent entries</div>
                <div class="grid" style="gap:.75rem;">
                    @forelse($goals as $goal)
                        <div class="goal-entry">
                            <div style="font-weight:600;">{{ $goal->title }}</div>
                            <div style="color:#94a3b8;">{{ $goal->description ?? 'No notes' }}</div>
                            <div style="font-size:.85rem; color:#38bdf8;">{{ $goal->target_date?->format('M d') ?? 'No target' }}</div>
                        </div>
                    @empty
                        <p style="color:#94a3b8;">Nothing logged yet. Set your first goal above.</p>
                    @endforelse
                </div>
            </div>
        </div>
    </div>
</body>
</html>

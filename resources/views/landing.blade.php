<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>FitFlow – Retention OS for Gyms</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #050817;
            --panel: rgba(9, 12, 29, 0.85);
            --border: rgba(255,255,255,0.08);
            --accent: linear-gradient(120deg,#4b79ff,#2f63ff);
        }
        * { box-sizing: border-box; }
        body { font-family:'Inter',sans-serif; margin:0; background:radial-gradient(circle at top,#0b1433,#050817); color:#e2e8f0; }
        a { color:inherit; text-decoration:none; }
        nav { position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:1.25rem 3rem;background:rgba(5,8,23,.92);backdrop-filter:blur(18px);border-bottom:1px solid var(--border); }
        .brand { display:flex;align-items:center;gap:.8rem; }
        .brand-logo { width:44px;height:44px;border-radius:14px;background:var(--accent);display:grid;place-items:center;font-weight:700; }
        .nav-links { display:flex;gap:1.5rem;font-size:.95rem;color:#cbd5f5; }
        .hero { padding:4rem 2rem 3rem;text-align:center; max-width:960px;margin:auto; }
        .hero h1 { font-size:clamp(2.7rem,4vw,3.8rem); margin:1rem 0; }
        .hero p { color:#94a3b8; font-size:1.1rem; margin:0 auto 2rem; max-width:720px; }
        .cta-group { display:flex;gap:1rem;justify-content:center;flex-wrap:wrap; }
        .cta { background:var(--accent); color:#fff; padding:.95rem 1.8rem; border-radius:999px; font-weight:600; }
        .cta.secondary { border:1px solid rgba(255,255,255,.3); background:transparent; }
        .section { max-width:1200px;margin:0 auto;padding:0 2rem 3rem;display:grid;gap:2rem; }
        .card { background:var(--panel); border:1px solid var(--border); border-radius:1.5rem; padding:2rem; box-shadow:0 35px 80px rgba(0,0,0,.35); }
        .features { display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.25rem; }
        .features div { background:rgba(255,255,255,.03); border-radius:1rem; padding:1.25rem; border:1px solid rgba(255,255,255,.05); }
        .pill { display:inline-flex;gap:.35rem;align-items:center;padding:.25rem .75rem;border-radius:999px;background:rgba(148,163,184,.15);font-size:.8rem;color:#cbd5f5; }
        form input, form select { width:100%; border-radius:.9rem; border:1px solid rgba(148,163,184,.3); background:rgba(255,255,255,.03); color:#fff; padding:.85rem 1rem; font-size:.95rem; }
        label { font-size:.85rem; color:#cbd5f5; display:block; }
        .grid-two { display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.2rem; }
        .login-toggle { display:flex;gap:1rem;margin-bottom:1rem; }
        .login-toggle button { flex:1;border:1px solid rgba(148,163,184,.4);background:transparent;color:#cbd5f5;padding:.75rem;border-radius:.9rem;font-weight:600;cursor:pointer; }
        .login-toggle button.active { border-color:transparent;background:rgba(75,121,255,.15);color:#fff; }
        .message { padding:.75rem 1rem;border-radius:.9rem;margin-top:.75rem;font-size:.9rem; }
        .success { background:rgba(34,197,94,.15);color:#bbf7d0; }
        .error { background:rgba(248,113,113,.15);color:#fecdd3; }
        footer { text-align:center;padding:2rem;color:#94a3b8;font-size:.85rem; }
        @media (max-width:720px) {
            nav { flex-direction:column; gap:1rem; padding:1rem 1.5rem; }
            .nav-links { flex-wrap:wrap; justify-content:center; }
            .cta-group { flex-direction:column; }
        }
    </style>
</head>
<body>
    <nav>
        <div class="brand">
            <div class="brand-logo">FF</div>
            <div>
                <strong>FitFlow</strong>
                <div style="font-size:.75rem;color:#94a3b8;">Studio Operating OS</div>
            </div>
        </div>
        <div class="nav-links">
            <a href="#platform">Platform</a>
            <a href="#automation">Automation</a>
            <a href="#pricing">Pricing</a>
            <a href="/login">Login</a>
        </div>
        <div class="cta-group" style="margin:0;">
            <a class="cta" href="/subscribe">Launch workspace</a>
            <a class="cta secondary" href="#pricing">See pricing</a>
        </div>
    </nav>

    <section class="hero">
        <p class="pill">FitFlow SaaS</p>
        <h1>Retention, revenue, and comms—built for boutique gyms.</h1>
        <p>Plug into Mindbody or CSVs, automate engagement, and give every member a premium experience in weeks, not quarters.</p>
        <div class="cta-group">
            <a class="cta" href="/subscribe">Start for ${{ $monthly_price }}/month</a>
            <a class="cta secondary" href="#platform">Explore FitFlow</a>
        </div>
    </section>

    <section id="platform" class="section">
        <div class="card" id="pricing">
            <div style="display:flex;flex-direction:column;gap:1rem;">
                <div>
                    <div class="pill">Simple pricing</div>
                    <div class="price-tag" style="margin:.6rem 0 0;">${{ $monthly_price }} <span>/ month · no hidden fees</span></div>
                    <p style="color:#94a3b8;">Includes unlimited members, automation, branded portals, and priority support.</p>
                </div>
                <ul style="list-style:none;padding:0;margin:0;display:grid;gap:.65rem;font-size:.95rem;color:#cbd5f5;">
                    <li>✓ Automated retention playbooks & freeze saves</li>
                    <li>✓ White-labeled member portal & branded comms</li>
                    <li>✓ CRM, capacity forecasting, and observability</li>
                    <li>✓ Secure APIs + mocked Mindbody import on day one</li>
                </ul>
            </div>
        </div>
        <div class="features">
            <div>
                <h3>Smart automations</h3>
                <p>Playbooks, nudges, and win-back flows align with your policy caps and quiet hours.</p>
            </div>
            <div>
                <h3>Full white-label</h3>
                <p>Upload logos, set colors, map custom domains, and pipe email through your SMTP.</p>
            </div>
            <div>
                <h3>Coach + CRM hub</h3>
                <p>Lifecycle pipeline, class fills, freeze rescues, and coach outcomes in one console.</p>
            </div>
            <div>
                <h3>Member portal</h3>
                <p>Members access goals, streaks, and templates through your embedded iframe or domain.</p>
            </div>
        </div>
    </section>

    <section id="automation" class="section">
        <div class="card" style="display:grid;gap:1.25rem;">
            <h2 style="margin:0;">Retention automation, observability, and CRM</h2>
            <div class="grid-two">
                <div style="background:rgba(75,121,255,.12);border-radius:1rem;padding:1.25rem;">
                    <h4>Playbooks & freeze rescue</h4>
                    <p style="color:#94a3b8;">Automated interventions for churn risk, freeze requests, and 30-day win-backs. Throttle rules respect member caps and quiet hours automatically.</p>
                </div>
                <div style="background:rgba(255,255,255,.03);border-radius:1rem;padding:1.25rem;">
                    <h4>Coach + CRM console</h4>
                    <p style="color:#94a3b8;">Manual nudges, class fill data, and lead-to-member conversion flow through a single queue so front desks and sales stay in sync.</p>
                </div>
                <div style="background:rgba(255,255,255,.03);border-radius:1rem;padding:1.25rem;">
                    <h4>Observability</h4>
                    <p style="color:#94a3b8;">Latency tracking, release notes, and SLO dashboards ensure every integration and campaign is measurable.</p>
                </div>
                <div style="background:rgba(255,255,255,.03);border-radius:1rem;padding:1.25rem;">
                    <h4>API-first foundation</h4>
                    <p style="color:#94a3b8;">Mocked Mindbody import today, signed HMAC webhooks tomorrow—FitFlow is built for hybrid stacks.</p>
                </div>
            </div>
        </div>
    </section>

    <footer>
        © {{ date('Y') }} FitFlow · SaaS for modern gyms · support@fitflow.app
    </footer>
</body>
</html>

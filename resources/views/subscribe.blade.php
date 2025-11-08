<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>FitFlow Subscription</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root { --accent: linear-gradient(120deg,#4b79ff,#2f63ff); }
        * { box-sizing:border-box; }
        body { font-family:'Inter',sans-serif; margin:0; background:#040618; color:#e2e8f0; }
        header { padding:1.5rem 2rem;border-bottom:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center; }
        a { color:inherit;text-decoration:none; }
        .container { max-width:720px;margin:3rem auto;padding:0 1.5rem; }
        .card { background:rgba(9,12,29,.9); border:1px solid rgba(255,255,255,.08); border-radius:1.5rem; padding:2rem; box-shadow:0 30px 70px rgba(0,0,0,.5); }
        label { display:block;font-size:.85rem;color:#cbd5f5;margin-bottom:.4rem; }
        input, select { width:100%; border-radius:.9rem; border:1px solid rgba(148,163,184,.3); background:rgba(255,255,255,.03); color:#fff; padding:.85rem 1rem; font-size:.95rem; margin-bottom:1rem; }
        button { width:100%; border:none; border-radius:.95rem; padding:1rem; font-weight:600; font-size:1rem; background:var(--accent); color:#fff; cursor:pointer; }
        .note { color:#94a3b8;font-size:.85rem;margin-top:.75rem; }
        .message { padding:.75rem 1rem;border-radius:.9rem;margin-top:.75rem;font-size:.9rem; }
        .success { background:rgba(34,197,94,.15);color:#bbf7d0; }
        .error { background:rgba(248,113,113,.15);color:#fecdd3; }
    </style>
</head>
<body>
    <header>
        <a href="/" style="font-weight:600;">← Back to FitFlow</a>
        <a href="/login" style="font-size:.9rem;color:#cbd5f5;">Existing customer login</a>
    </header>
    <main class="container">
        <div class="card">
            <h1 style="margin-top:0;">Start FitFlow for $99.95/month</h1>
            <p style="color:#94a3b8;">Secure Stripe checkout · cancel anytime.</p>
            <form id="checkout-form">
                <label>Studio name</label>
                <input name="organization_name" required placeholder="Flow Athletics">
                <label>Primary timezone</label>
                <select name="timezone">
                    <option>America/Los_Angeles</option>
                    <option>America/New_York</option>
                    <option>UTC</option>
                    <option>Europe/London</option>
                </select>
                <label>Owner full name</label>
                <input name="admin_name" required placeholder="Jordan Lane">
                <label>Owner email</label>
                <input name="admin_email" type="email" required placeholder="jordan@flowathletics.com">
                <label>Workspace subdomain</label>
                <div style="display:flex;gap:.5rem;align-items:center;">
                    <input name="subdomain" required placeholder="mygym" style="margin-bottom:0;">
                    <span style="color:#94a3b8;font-size:.85rem;">.fitflow.app</span>
                </div>
                <label>Card number (test 4242 4242 4242 4242)</label>
                <input name="card_number" required value="4242424242424242">
                <label>Expiry month</label>
                <input name="card_exp_month" type="number" min="1" max="12" required value="12">
                <label>Expiry year</label>
                <input name="card_exp_year" type="number" min="{{ date('Y') }}" required value="{{ date('Y') + 1 }}">
                <label>CVC</label>
                <input name="card_cvc" required value="123">
                <button type="submit" id="checkout-button">Charge ${{ $monthly_price }} & create workspace</button>
                <p class="note">We create your owner login instantly and send you to Settings to finish white-labeling.</p>
                <div id="checkout-message"></div>
            </form>
        </div>
    </main>
    <script>
        const checkoutForm = document.getElementById('checkout-form');
        const checkoutMessage = document.getElementById('checkout-message');
        const checkoutButton = document.getElementById('checkout-button');
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

        checkoutForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Processing…';
            checkoutMessage.innerHTML = '';
            const jsonData = Object.fromEntries(new FormData(checkoutForm).entries());
            try {
                const response = await fetch('/api/v1/checkout/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken
                    },
                    body: JSON.stringify(jsonData)
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message ?? 'Payment failed.');
                }
                const payload = await response.json();
                checkoutMessage.innerHTML = `<div class="message success">Owner login: <strong>${payload.data.login_email}</strong> · Temp password: <code>${payload.data.temp_password}</code>. Redirecting to login…</div>`;
                setTimeout(() => window.location.href = payload.data.next_url, 2500);
            } catch (error) {
                checkoutMessage.innerHTML = `<div class="message error">${error.message}</div>`;
            } finally {
                checkoutButton.disabled = false;
                checkoutButton.textContent = 'Charge ${{ $monthly_price }} & create workspace';
            }
        });
    </script>
</body>
</html>

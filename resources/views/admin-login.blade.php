<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>FitFlow Admin Login</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: radial-gradient(circle at top,#040618,#0f172a); min-height:100vh; display:flex; align-items:center; justify-content:center; margin:0; color:#e2e8f0; }
        .card { width:100%; max-width:420px; background:rgba(15,23,42,.92); border-radius:1.5rem; padding:2.5rem; box-shadow:0 45px 90px rgba(0,0,0,.5); border:1px solid rgba(148,163,184,.2); }
        label { display:block; font-size:.9rem; margin-top:1.4rem; color:#cbd5f5; }
        input { width:100%; border-radius:.95rem; border:1px solid rgba(148,163,184,.3); background:rgba(15,23,42,.5); color:#fff; padding:.9rem 1rem; margin-top:.4rem; }
        button { width:100%; border:none; border-radius:.95rem; padding:.95rem; margin-top:1.8rem; font-weight:600; cursor:pointer; background:linear-gradient(120deg,#4b79ff,#2f63ff); color:#fff; box-shadow:0 20px 45px rgba(75,121,255,.35); }
        .error { color:#fecdd3; font-size:.85rem; margin-top:.4rem; }
        .meta { font-size:.85rem; color:#94a3b8; margin-top:1rem; text-align:center; }
    </style>
</head>
<body>
    <div class="card">
        <p style="margin:0 0 .35rem;font-weight:600;color:#94a3b8;">FitFlow Control Panel</p>
        <h1 style="margin:0;font-size:1.6rem;">Admin login</h1>
        <form method="POST" action="{{ route('admin.login.attempt') }}">
            @csrf
            <label>
                Email
                <input type="email" name="email" value="{{ old('email') }}" required autofocus>
            </label>
            @error('email')
                <div class="error">{{ $message }}</div>
            @enderror
            <label>
                Password
                <input type="password" name="password" required>
            </label>
            <label style="display:flex;align-items:center;gap:.5rem;font-size:.85rem;color:#cbd5f5;margin-top:1rem;">
                <input type="checkbox" name="remember" style="width:auto;margin:0;"> Remember me
            </label>
            <button type="submit">Sign in</button>
        </form>
        <p class="meta">Members should log in at <a href="/member/login" style="color:#93c5fd;">/member/login</a></p>
    </div>
</body>
</html>

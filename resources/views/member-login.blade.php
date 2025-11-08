<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Member Login</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #4b79ff;
            --accent: #2f63ff;
        }
        body {
            font-family: 'Inter', sans-serif;
            background: radial-gradient(circle at top, #0b1538, #020614);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #e2e8f0;
        }
        .card {
            width: 100%;
            max-width: 420px;
            background: rgba(15,23,42,0.9);
            border-radius: 1.25rem;
            padding: 2.25rem;
            box-shadow: 0 45px 90px rgba(2,6,23,0.6);
            border: 1px solid rgba(148,163,184,0.2);
        }
        label {
            display: block;
            font-size: .9rem;
            margin-top: 1.4rem;
            color: #cbd5f5;
        }
        input {
            width: 100%;
            border-radius: .9rem;
            border: 1px solid rgba(148,163,184,0.3);
            padding: .85rem 1rem;
            background: rgba(15,23,42,0.6);
            color: #f8fafc;
            margin-top: .5rem;
        }
        button {
            width: 100%;
            border: none;
            border-radius: .95rem;
            padding: .95rem;
            margin-top: 2rem;
            font-weight: 600;
            color: #fff;
            background: linear-gradient(90deg,var(--primary),var(--accent));
            box-shadow: 0 25px 45px rgba(75,121,255,0.35);
            cursor: pointer;
        }
        .error { color: #f87171; font-size: .85rem; margin-top: .4rem; }
    </style>
</head>
<body>
    <div class="card">
        <h1 style="margin:0 0 .35rem;font-size:1.75rem;">Member login</h1>
        <p style="margin:0;color:#94a3b8;">Access your FitFlow member portal.</p>

        <form method="POST" action="{{ route('member.login.attempt') }}">
            @csrf
            <label>
                Email
                <input name="email" type="email" value="{{ old('email') }}" required autofocus>
            </label>
            @error('email')
                <div class="error">{{ $message }}</div>
            @enderror
            <label>
                Password
                <input name="password" type="password" required>
            </label>
            <label style="display:flex;align-items:center;gap:.5rem;font-size:.85rem;color:#cbd5f5;margin-top:1rem;">
                <input type="checkbox" name="remember" style="width:auto;margin:0;"> Remember me
            </label>
            <button type="submit">Sign in</button>
        </form>
    </div>
</body>
</html>

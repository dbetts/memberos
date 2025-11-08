<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FitFlow Lead Capture</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: radial-gradient(circle at top,#ffffff,#eef2ff); padding: 2rem; color: #0f172a; }
        .card { max-width: 480px; margin: 0 auto; background: #ffffff; padding: 2.25rem; border-radius: 1.5rem; box-shadow: 0 35px 65px rgba(9,22,67,0.12); border: 1px solid rgba(15,35,95,0.08); }
        label { display: block; font-size: .9rem; color: #475569; margin-top: 1.25rem;}
        input { width: 100%; padding: .75rem 1rem; border-radius: .9rem; border: 1px solid #c1cdfc; margin-top: .4rem; background: #f8f9ff; }
        button { width: 100%; margin-top: 1.5rem; border: none; background: linear-gradient(90deg,#4b79ff,#2f63ff); color: white; padding: .95rem; border-radius: .95rem; font-weight: 600; box-shadow: 0 20px 35px rgba(47,99,255,0.3); }
        .message { margin-top: 1rem; font-size: .9rem; color: #0b1538; }
    </style>
</head>
<body>
    <div class="card">
        <h1 style="font-size:1.6rem; color:#0f172a; margin-bottom:.35rem;">Book a Visit with FitFlow</h1>
        <p style="color:#64748b;">Tell us how to reach you and we’ll confirm your tour within one business day.</p>

        @if(session('success'))
            <div class="message">{{ session('success') }}</div>
        @endif

        <form method="POST" action="{{ url('/public/leads') }}">
            @csrf
            <label>
                First name
                <input name="first_name" required>
            </label>
            <label>
                Last name
                <input name="last_name" required>
            </label>
            <label>
                Email
                <input name="email" type="email">
            </label>
            <label>
                Phone
                <input name="phone">
            </label>
            <button type="submit">Submit</button>
        </form>
    </div>
</body>
</html>

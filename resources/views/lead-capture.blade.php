<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MemberOS Lead Capture</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f1f5f9; padding: 2rem; }
        .card { max-width: 480px; margin: 0 auto; background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 20px 45px rgba(15,23,42,0.09); }
        label { display: block; font-size: .9rem; color: #475569; margin-top: 1.25rem;}
        input { width: 100%; padding: .75rem 1rem; border-radius: .65rem; border: 1px solid #cbd5f5; margin-top: .4rem;}
        button { width: 100%; margin-top: 1.5rem; border: none; background: #2563eb; color: white; padding: .85rem; border-radius: .8rem; font-weight: 600;}
        .message { margin-top: 1rem; font-size: .9rem; color: #0f172a; }
    </style>
</head>
<body>
    <div class="card">
        <h1 style="font-size:1.5rem; color:#0f172a;">Book a Visit</h1>
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

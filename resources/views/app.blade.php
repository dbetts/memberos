<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FitFlow — Studio Operating Console</title>
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="color-scheme" content="light dark"/>
        <meta name="fitflow-branding" content='@json($branding ?? null)'>
        @if(($branding ?? null)?->primary_color)
            <style>
                :root {
                    --brand-primary: {{ $branding->primary_color }};
                    --brand-accent: {{ $branding->accent_color ?? $branding->primary_color }};
                }
            </style>
        @endif
        <link rel="icon" href="/fav/favicon.ico" sizes="any">
        <link rel="icon" type="image/png" sizes="32x32" href="/fav/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/fav/favicon-16x16.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/fav/apple-touch-icon.png">
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body class="bg-[radial-gradient(circle_at_top,#ffffff,#eef2ff)]">
        <div id="root"></div>
        <script id="fitflow-bootstrap" type="application/json">@json($bootstrapData ?? null)</script>
    </body>
</html>

import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(
    {
        plugins: [
            laravel({
                        input  : [
                            'resources/css/app.css',
                            'resources/js/app.tsx',
                        ],
                        refresh: true,
                    }),
            react(),
            tailwindcss(),
        ],
        server : {
            fs   : {allow: [ '.', 'Modules', 'node_modules' ], strict: false},
            host : '0.0.0.0',
            port : 5173,
            hmr  : {
                host: 'memberos.test',
            },
            watch: {
                ignored: [
                    '**/*Controller.php',
                    'app/**',
                    'bootstrap/**',
                    'config/**',
                    'database/**',
                    'routes/**',
                    'storage/**',
                    'tests/**',
                    'vendor/**',
                ],
            },
        },
    }
);
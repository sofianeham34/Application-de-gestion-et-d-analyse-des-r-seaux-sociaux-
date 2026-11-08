import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import Pages from 'vite-plugin-pages'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    return {
        plugins: [
            react(),
            tailwindcss(),
            Pages({ dirs: 'src/pages' }),
        ],
        build: {
            target: 'esnext',
        },
        server: {
            host: '0.0.0.0',
            // En développement, /api est redirigé vers la gateway
            proxy: {
                '/api': env.VITE_PROXY_GATEWAY || 'http://localhost:3000',
            },
        },
    }
})

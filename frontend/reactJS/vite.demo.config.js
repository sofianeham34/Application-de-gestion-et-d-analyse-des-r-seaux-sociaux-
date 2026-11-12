import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import Pages from 'vite-plugin-pages'
import { fileURLToPath } from 'node:url'

// Démo statique (GitHub Pages) : l'API est simulée dans le navigateur (demo/backend.js).
// npm run build:demo  →  dist-demo/
const here = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
    root: here('./demo'),
    base: './',
    publicDir: here('./public'),
    plugins: [
        react(),
        tailwindcss(),
        Pages({ dirs: here('./src/pages') }),
        {
            name: 'ascendia-demo',
            enforce: 'pre',
            resolveId(source, importer) {
                if (source === 'react-router-dom' && !importer?.endsWith('/demo/router.js')) return here('./demo/router.js')
                return null
            },
        },
    ],
    build: { outDir: here('./dist-demo'), emptyOutDir: true, target: 'esnext' },
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),    
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    base: './',
    build: {
        outDir: 'dist/renderer',
        emptyOutDir: true,
    },
    server: {
        port: 5173,
    }
}); 
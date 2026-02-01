import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite automatically exposes env vars prefixed with VITE_ to the client
// For testing: Create a .env file with VITE_GEMINI_API_KEY=your_key
// For production: Use VITE_API_PROXY_URL to point to your backend proxy

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});

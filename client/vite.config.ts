import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Canonical backend is cline_backend (Express + Prisma), which defaults to :4000.
// Override with VITE_BACKEND_ORIGIN if the API runs elsewhere.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  };
});

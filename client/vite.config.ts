import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Canonical backend is cline_backend (Express + Prisma), which defaults to :4000.
// Telemetry WebSocket is server, which defaults to :5000.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://localhost:4000';
  const wsOrigin = env.VITE_WS_ORIGIN || 'ws://localhost:5000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
        '/ws': {
          target: wsOrigin,
          ws: true,
        },
      },
    },
  };
});

// proxy.conf.ts
import type { ProxyOptions } from 'vite';

export default {
  // adapt paths to your API routes
  '/api': {
    target: 'https://localhost:5001',
    changeOrigin: true,
    secure: false,        // <— allow self-signed backend cert in dev
    ws: true,
    // optional:
    // rewrite: (path: string) => path.replace(/^\/api/, '')
  } satisfies ProxyOptions
};

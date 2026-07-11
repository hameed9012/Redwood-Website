import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    // forks pool worker fails to start on this Windows env (Vitest 4);
    // threads pool starts reliably.
    pool: 'threads',
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // The real `server-only` package always throws on import; Next.js aliases
      // it away for server bundles at build time, but vitest has no such
      // aliasing. Stub it so portal loader tests (which import serverClient.ts)
      // can run without a real Next.js build.
      'server-only': path.resolve(__dirname, 'lib/portal/__mocks__/server-only.ts'),
    },
  },
});

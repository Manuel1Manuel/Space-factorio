import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: { host: '0.0.0.0' },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['space-factorio.onrender.com'],
  },
  test: { environment: 'node' },
});

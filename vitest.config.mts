import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      include: [
        'app/api/transactions/**/route.ts',
        'app/api/auth/**/route.ts',
        'app/api/businesses/route.ts',
        'app/api/ocr/route.ts',
        'app/api/chat/route.ts',
        'services/inventory.service.ts',
        'services/crm.service.ts',
      ],
      reporter: ['text', 'html'],
    },
  },
});

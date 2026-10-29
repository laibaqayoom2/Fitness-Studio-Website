import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.js'],
    // Integration tests hit a remote (Neon) database; one query round-trip can
    // take over a second, so the default 5 s timeout is too tight.
    testTimeout: 60000,
    hookTimeout: 60000,
    // Placeholders so config.js parses without a real .env. These unit tests
    // never contact the database. Integration tests additionally require
    // TEST_DATABASE_URL and are skipped when it is not provided.
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/ffl_test',
      CLIENT_ORIGIN: 'http://localhost:5173',
      PORT: '3000',
      SESSION_TTL_DAYS: '7',
      COOKIE_SAMESITE: 'lax',
      NODE_ENV: 'test',
      STRIPE_SECRET_KEY: 'sk_test_local_placeholder',
      STRIPE_WEBHOOK_SECRET: 'whsec_local_test_secret',
    },
  },
})

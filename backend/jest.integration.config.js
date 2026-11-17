/**
 * Testes de integração: rotas HTTP reais + Postgres + Redis.
 * Banco: TEST_DATABASE_URL (recriado a cada execução pelo globalSetup).
 * Rodar: npm run test:integration   (com Postgres/Redis no ar — ex.: npm run db:embedded)
 */
const base = require('./jest.config')

module.exports = {
    ...base,
    testMatch: ['<rootDir>/src/tests/integration/**/*.e2e.spec.ts'],
    globalSetup: '<rootDir>/src/tests/integration/globalSetup.js',
    globalTeardown: undefined,
    setupFiles: ['<rootDir>/src/tests/integration/env.ts'],
    // knex mantém um keep-alive (setInterval); encerra o processo ao final
    forceExit: true,
    testTimeout: 60000,
    maxWorkers: 1
}

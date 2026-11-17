/**
 * Testes unitários (repositórios em memória e Redis falso): não precisam de Postgres/Redis.
 */
const base = require('./jest.config')

module.exports = {
    ...base,
    setupFiles: ['<rootDir>/src/shared/tests/setupUnit.ts'],
    // Integração roda separada (jest.integration.config.js), com Postgres/Redis reais
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/tests/integration/', '<rootDir>/dist/']
}

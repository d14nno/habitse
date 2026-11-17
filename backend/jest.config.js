/**
 * Configuração base do Jest (aliases e ts-jest).
 * Use os scripts: npm run test:unit (jest.unit.config.js) e npm run test:integration (jest.integration.config.js).
 */
module.exports = {
    clearMocks: true,
    coverageProvider: 'v8',
    moduleNameMapper: {
        '^@modules/(.*)$': '<rootDir>/src/modules/$1',
        '^@shared/(.*)$': '<rootDir>/src/shared/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1'
    },
    preset: 'ts-jest',
    verbose: true
}

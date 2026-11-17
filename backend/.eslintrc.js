module.exports = {
    root: true,
    env: {
        es6: true,
        node: true
    },
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname
    },
    plugins: ['@typescript-eslint', 'import'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript'
    ],
    rules: {
        '@typescript-eslint/ban-types': 'off',
        'no-console': 'warn',
        'semi': ['error', 'never'],
        'quotes': ['error', 'single'],
        'indent': ['error', 4],
        'object-curly-spacing': ['error', 'always'],
        'max-len': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                'vars': 'all',
                'args': 'after-used',
                'ignoreRestSiblings': true,
                'varsIgnorePattern': '^_',
                'argsIgnorePattern': '^_'
            }
        ],
    },
    ignorePatterns: ['dist/', 'node_modules/', 'coverage/'],
    settings: {
        'import/resolver': {
            typescript: {
                project: './tsconfig.json'
            }
        }
    }
};

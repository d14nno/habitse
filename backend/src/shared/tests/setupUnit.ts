// Carregado antes de cada spec unitário (jest setupFiles): ambiente de teste sem depender do .env
process.env.NODE_ENV = 'test'
process.env.HASH_AUTH_SECRET = process.env.HASH_AUTH_SECRET || 'unit-test-secret'

// Testes nunca falam com serviços reais, mesmo com credenciais no .env (dotenv não sobrescreve variáveis já definidas)

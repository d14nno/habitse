// Carregado antes de qualquer import dos testes de integração (jest setupFiles)
process.env.NODE_ENV = 'test'
// Testes nunca falam com serviços reais, mesmo com credenciais no .env (dotenv não sobrescreve variáveis já definidas)

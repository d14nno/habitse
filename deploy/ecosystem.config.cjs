// PM2: mantém a API no ar, reinicia se cair e sobe junto com o servidor (pm2 startup + pm2 save).
// Uso (dentro de backend/ no servidor): pm2 start ../deploy/ecosystem.config.cjs
module.exports = {
    apps: [
        {
            name: 'habitse-api',
            cwd: '/srv/habitse/backend',
            script: 'dist/server.js',
            instances: 1,
            exec_mode: 'fork',
            max_memory_restart: '400M',
            env: { NODE_ENV: 'production', PORT: 3900 },
            // As demais variáveis (banco, segredo JWT, CORS...) vêm do arquivo /srv/habitse/backend/.env
            time: true
        }
    ]
}

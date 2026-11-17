/* eslint-disable no-console */
/**
 * Postgres local sem Docker (binários do pacote embedded-postgres).
 * Uso: npm run db:embedded   → sobe em localhost:55432 (usuário/senha: app; porta: EMBEDDED_PG_PORT no .env)
 * Banco de dados persistido em ./.tmp/postgres (apague a pasta para recomeçar do zero).
 */
require('dotenv/config')
const path = require('path')
const fs = require('fs')
const { default: EmbeddedPostgres } = require('embedded-postgres')

const PORT = Number(process.env.EMBEDDED_PG_PORT || 55432)
const dataDir = path.resolve(__dirname, '..', '.tmp', 'postgres')
const databases = (process.env.EMBEDDED_PG_DATABASES || 'app,app_test').split(',')

async function main() {
    const isNew = !fs.existsSync(path.join(dataDir, 'PG_VERSION'))

    const pg = new EmbeddedPostgres({
        databaseDir: dataDir,
        user: 'app',
        password: 'app',
        port: PORT,
        persistent: true,
        // UTF-8 independente da localidade do Windows (o padrão seria WIN1252, sem suporte a emoji)
        initdbFlags: ['--encoding=UTF8', '--locale=C'],
        onLog: () => {}
    })

    if (isNew) await pg.initialise()
    await pg.start()

    for (const database of databases) {
        try {
            await pg.createDatabase(database)
            console.log(`🗄️  banco ${database} criado`)
        } catch {
            // já existe
        }
    }

    console.log(`✅ Postgres rodando em postgresql://app:app@localhost:${PORT}/${databases[0]}`)

    const stop = async () => {
        await pg.stop()
        process.exit(0)
    }

    process.on('SIGINT', stop)
    process.on('SIGTERM', stop)

    if (process.argv.includes('--once')) await stop()
}

main().catch(error => {
    console.error('❌ Falha ao iniciar o Postgres embutido:', error)
    process.exit(1)
})

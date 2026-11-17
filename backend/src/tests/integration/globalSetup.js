/* eslint-disable no-console */
/**
 * Recria o banco de teste (TEST_DATABASE_URL), roda as migrations e a seed.
 * Usa TEST_ADMIN_DATABASE_URL para o DROP/CREATE DATABASE.
 * (JavaScript puro: o globalSetup do Jest não passa pelo ts-jest)
 */
require('dotenv/config')
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } })
const path = require('path')
const knex = require('knex')

module.exports = async function globalSetup() {
    const testUrl = process.env.TEST_DATABASE_URL
    const adminUrl = process.env.TEST_ADMIN_DATABASE_URL

    if (!testUrl || !adminUrl) throw new Error('Defina TEST_DATABASE_URL e TEST_ADMIN_DATABASE_URL no .env')

    const database = new URL(testUrl).pathname.replace('/', '')

    if (!/test/.test(database)) throw new Error(`Por segurança o banco de teste precisa ter "test" no nome (atual: ${database})`)

    const admin = knex({ client: 'pg', connection: adminUrl })
    await admin.raw('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ? AND pid <> pg_backend_pid()', [database])
    await admin.raw(`DROP DATABASE IF EXISTS "${database}"`)
    await admin.raw(`CREATE DATABASE "${database}" ENCODING 'UTF8' TEMPLATE template0`)
    await admin.destroy()

    const db = knex({
        client: 'pg',
        connection: testUrl,
        migrations: { directory: path.resolve(__dirname, '../../shared/infra/knex/database/migrations'), tableName: 'migrations_knex', loadExtensions: ['.ts'] },
        seeds: { directory: path.resolve(__dirname, '../../shared/infra/knex/database/seeds'), loadExtensions: ['.ts'] }
    })

    await db.migrate.latest()
    await db.seed.run()
    await db.destroy()

    console.log(`\n🗄️  banco ${database} pronto (migrations + seed)`)
}

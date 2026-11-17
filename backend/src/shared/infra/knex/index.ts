import knex from 'knex'
import pg from 'pg'

import { config } from '../../config'

import configuration from './knexfile'

let dbConfig: any // Knex.Config - import de knex as types se necessário

if (config.get('environment') === 'production') {
    dbConfig = configuration.production
} else if (config.get('environment') === 'test') {
    dbConfig = configuration.test
} else {
    dbConfig = configuration.development
}

pg.defaults.ssl = false

pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => {
    return parseInt(value, 10)
})

pg.types.setTypeParser(pg.types.builtins.FLOAT8, (value: string) => {
    return parseFloat(value)
})

pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value: string) => {
    return parseFloat(value)
})

const connection = knex(dbConfig)

const keepConnectionAlive = async () => {
    try {
        // Executa uma query simples para manter a conexão ativa
        await connection.raw('SELECT 1')
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('⚠️ [Database] Connection keep-alive failed:', message)
    }
}

// Define um intervalo de 60 segundos (60000 milissegundos)
setInterval(keepConnectionAlive, 60000)

export { connection }

import path from 'path'
import { config } from '../../config'

export default {
    test: {
        client: 'pg',
        debug: false,
        connection: config.get('db.test.url'),
        acquireConnectionTimeout: 10000,
        migrations: {
            directory: path.resolve(__dirname, 'database/migrations'),
            tableName: 'migrations_knex'
        },
        seeds: {
            directory: path.resolve(__dirname, 'database/seeds')
        },
        pool: {
            min: 0,
            max: 100,
            afterCreate: (conn: any, done: Function) => {
                conn.query('SET TIME ZONE \'America/Sao_Paulo\';', (err: any) => {
                    done(err, conn)
                })
            }
        },
        idleTimeoutMillis: 30000,
        createTimeoutMillis: 3000,
        acquireTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100
    },
    development: {
        client: 'pg',
        debug: false,
        connection: config.get('db.url'),
        acquireConnectionTimeout: 10000,
        migrations: {
            directory: path.resolve(__dirname, 'database/migrations'),
            tableName: 'migrations_knex'
        },
        seeds: {
            directory: path.resolve(__dirname, 'database/seeds')
        },
        pool: {
            min: 0,
            max: 100,
            afterCreate: (conn: any, done: Function) => {
                conn.query('SET TIME ZONE \'America/Sao_Paulo\';', (err: any) => {
                    done(err, conn)
                })
            }
        },
        idleTimeoutMillis: 30000,
        createTimeoutMillis: 3000,
        acquireTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100
    },
    production: {
        client: 'pg',
        debug: false,
        connection: {
            connectionString: config.get('db.url'),
            keepAlive: true,
            tcp_keepalives_idle: 30,
            tcp_keepalives_interval: 10,
            tcp_keepalives_count: 3
        },
        acquireConnectionTimeout: 10000,
        migrations: {
            directory: path.resolve(__dirname, 'database/migrations'),
            tableName: 'migrations_knex'
        },
        seeds: {
            directory: path.resolve(__dirname, 'database/seeds')
        },
        pool: {
            min: 2,
            max: 100,
            idleTimeoutMillis: 600000,
            acquireTimeoutMillis: 600000,
            createTimeoutMillis: 300000,
            reapIntervalMillis: 10000,
            createRetryIntervalMillis: 2000,
            afterCreate: (conn: any, done: Function) => {
                conn.query('SET TIME ZONE \'America/Sao_Paulo\';', (err: any) => {
                    done(err, conn)
                })
            }
        },
        idleTimeoutMillis: 600000,
        createTimeoutMillis: 300000,
        acquireTimeoutMillis: 600000,
        reapIntervalMillis: 10000,
        createRetryIntervalMillis: 2000
    }
}

import { AsyncLocalStorage } from 'async_hooks'
import { Knex } from 'knex'

import { connection } from '@shared/infra/knex'
import { UnitOfWork } from '@shared/types/UnitOfWork'

const storage = new AsyncLocalStorage<Knex.Transaction>()

/**
 * Conexão a usar nos repositórios Knex: a transação aberta por `UnitOfWork.run` (se houver) ou a conexão padrão.
 * Repositórios que participam de transações usam `db()` no lugar de `connection`.
 */
export function db(): Knex | Knex.Transaction {
    return storage.getStore() ?? connection
}

/** Indica se há transação aberta (necessário para `forUpdate`). */
export function inTransaction(): boolean {
    return Boolean(storage.getStore())
}

export class KnexUnitOfWork implements UnitOfWork {
    async run<T>(work: () => Promise<T>): Promise<T> {
        // Chamadas aninhadas reaproveitam a transação externa
        if (storage.getStore()) return work()

        return connection.transaction(trx => storage.run(trx, work))
    }
}

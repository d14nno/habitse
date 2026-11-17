/**
 * Executa várias operações de repositórios numa única transação.
 * Produção: `KnexUnitOfWork` (shared/infra/knex/transaction.ts). Testes: `InMemoryUnitOfWork`.
 */
export interface UnitOfWork {
    run<T>(work: () => Promise<T>): Promise<T>
}

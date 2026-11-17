import { UnitOfWork } from '@shared/types/UnitOfWork'

/** Repositórios em memória não têm transação: executa direto. */
export class InMemoryUnitOfWork implements UnitOfWork {
    async run<T>(work: () => Promise<T>): Promise<T> {
        return work()
    }
}

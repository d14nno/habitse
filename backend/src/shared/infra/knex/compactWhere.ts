/**
 * Remove filtros undefined antes de passar para `.where({...})`
 * (o Knex lança erro em binding undefined). Use em repositórios com filtros opcionais.
 */
export function compactWhere<T extends object>(where: T = {} as T): Partial<T> {
    return Object.fromEntries(Object.entries(where).filter(([, value]) => value !== undefined)) as Partial<T>
}

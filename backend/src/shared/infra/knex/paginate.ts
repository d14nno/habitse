import { Knex } from 'knex'
import { Paginated, PaginationParams } from '@shared/types/Pagination'

/**
 * Executa a query paginada e conta o total com a mesma query (sem order/limit).
 * A query deve selecionar no máximo uma linha por item (sem joins que multipliquem linhas).
 */
export async function paginate<T = any>(query: Knex.QueryBuilder, { page, perPage }: PaginationParams): Promise<Paginated<T>> {
    const countQuery = query.clone().clearSelect().clearOrder().count<{ total: string | number }[]>('* as total')

    const [rows, [{ total }]] = await Promise.all([
        query.clone().offset((page - 1) * perPage).limit(perPage),
        countQuery
    ])

    const totalNumber = Number(total)

    return {
        data: rows as T[],
        pagination: {
            page,
            perPage,
            total: totalNumber,
            lastPage: Math.max(1, Math.ceil(totalNumber / perPage))
        }
    }
}

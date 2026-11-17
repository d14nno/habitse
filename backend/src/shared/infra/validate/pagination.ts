import { Joi } from '@shared/infra/validate'
import { DEFAULT_PER_PAGE, MAX_PER_PAGE, PaginationParams } from '@shared/types/Pagination'

/** Campos de paginação para usar dentro de um Joi.object() de query */
export const paginationQuerySchema = {
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(MAX_PER_PAGE).default(DEFAULT_PER_PAGE)
}

/** Lê page/perPage da query já validada pelo celebrate */
export function getPaginationParams(query: Record<string, any>): PaginationParams {
    return {
        page: Number(query.page) || 1,
        perPage: Math.min(Number(query.perPage) || DEFAULT_PER_PAGE, MAX_PER_PAGE)
    }
}

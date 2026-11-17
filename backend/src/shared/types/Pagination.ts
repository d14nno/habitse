export interface PaginationParams {
    page: number
    perPage: number
}

export interface Paginated<T> {
    data: T[]
    pagination: {
        page: number
        perPage: number
        total: number
        lastPage: number
    }
}

export const DEFAULT_PER_PAGE = 20
export const MAX_PER_PAGE = 100

export function mapPaginated<T, R>(result: Paginated<T>, mapper: (item: T) => R): Paginated<R> {
    return { data: result.data.map(mapper), pagination: result.pagination }
}

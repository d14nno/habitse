import type { Filters, Sort } from '@/types/Listing'

const SORTS: Sort[] = ['recent', 'price_asc', 'price_desc', 'area_desc']

type RawQuery = Record<string, unknown>

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined)
const number = (value: unknown) => {
    const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

/** Lê os filtros da URL (?quartos=3&max=900000...). Valores inválidos são ignorados. */
export function filtersFromQuery(query: RawQuery): Filters {
    const sort = text(query.ordem) as Sort | undefined
    return {
        type: text(query.tipo),
        city: text(query.cidade),
        neighborhood: text(query.bairro),
        minPrice: number(query.min),
        maxPrice: number(query.max),
        bedrooms: number(query.quartos),
        parking: number(query.vagas),
        q: text(query.busca),
        sort: sort && SORTS.includes(sort) && sort !== 'recent' ? sort : undefined
    }
}

/** Filtros → parâmetros da URL (só o que foi preenchido, para a URL ficar curta e compartilhável) */
export function filtersToQuery(filters: Filters): Record<string, string> {
    const entries: [string, string | number | undefined][] = [
        ['tipo', filters.type], ['cidade', filters.city], ['bairro', filters.neighborhood], ['min', filters.minPrice], ['max', filters.maxPrice],
        ['quartos', filters.bedrooms], ['vagas', filters.parking], ['busca', filters.q], ['ordem', filters.sort && filters.sort !== 'recent' ? filters.sort : undefined]
    ]
    return Object.fromEntries(entries.filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => [key, String(value)]))
}

/** Quantos filtros estão ativos (selo no botão "Filtros"); ordenação não conta */
export const activeFilterCount = (filters: Filters) =>
    [filters.type, filters.city, filters.neighborhood, filters.minPrice, filters.maxPrice, filters.bedrooms, filters.parking].filter(value => value !== undefined).length

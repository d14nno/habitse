import { SITE } from '@/config'
import { catalogFacets, getFromCatalog, listCatalog, loadCatalog } from '@/api/staticCatalog'
import type { CategoryKey, Facets, Filters, ListingCard, ListingDetail, Paginated } from '@/types/Listing'

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message)
    }
}

type Query = Record<string, string | number | boolean | undefined | null>

const toSearch = (query: Query) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
    }
    const text = params.toString()
    return text ? `?${text}` : ''
}

async function request<T>(path: string, query: Query = {}, signal?: AbortSignal): Promise<T> {
    let response: Response
    try {
        response = await fetch(`${SITE.api}${path}${toSearch(query)}`, { signal, headers: { Accept: 'application/json' } })
    } catch (error) {
        if ((error as Error).name === 'AbortError') throw error
        throw new ApiError(0, 'Sem conexão. Verifique sua internet e tente de novo.')
    }
    if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new ApiError(response.status, body?.errors?.[0]?.message ?? 'Não foi possível carregar agora.')
    }
    return response.json() as Promise<T>
}

export interface ListParams extends Filters {
    category?: CategoryKey
    featured?: boolean
    page?: number
    perPage?: number
}

/**
 * De onde vêm os anúncios: se o site foi publicado com o catálogo estático (`/data/empreendimentos.json`, gerado pela
 * importação da Bambuí), ele é a fonte e a API não é consultada. Sem catálogo (ou com `VITE_LISTINGS_SOURCE=api`),
 * o site usa a API como sempre.
 */
const staticCatalog = () => (import.meta.env.VITE_LISTINGS_SOURCE === 'api' ? Promise.resolve(null) : loadCatalog())

export const listingsApi = {
    async list(params: ListParams, signal?: AbortSignal): Promise<Paginated<ListingCard>> {
        const catalog = await staticCatalog()

        return catalog ? listCatalog(catalog, params) : request<Paginated<ListingCard>>('/listings', params as Query, signal)
    },
    async get(slug: string, signal?: AbortSignal): Promise<ListingDetail> {
        const catalog = await staticCatalog()
        if (!catalog) return request<ListingDetail>(`/listings/${encodeURIComponent(slug)}`, {}, signal)

        const item = getFromCatalog(catalog, slug)
        if (!item) throw new ApiError(404, 'Imóvel não encontrado.')

        return item
    },
    async facets(category?: CategoryKey, signal?: AbortSignal): Promise<Facets> {
        const catalog = await staticCatalog()

        return catalog ? catalogFacets(catalog, category) : request<Facets>('/listings/facets', { category }, signal)
    }
}

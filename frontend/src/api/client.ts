import { SITE } from '@/config'
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

export const listingsApi = {
    list: (params: ListParams, signal?: AbortSignal) => request<Paginated<ListingCard>>('/listings', params as Query, signal),
    get: (slug: string, signal?: AbortSignal) => request<ListingDetail>(`/listings/${encodeURIComponent(slug)}`, {}, signal),
    facets: (category?: CategoryKey, signal?: AbortSignal) => request<Facets>('/listings/facets', { category }, signal)
}

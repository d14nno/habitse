import { Paginated, PaginationParams } from '@shared/types/Pagination'
import { Listing } from '../entities/Listing'
import { ListingCategory } from '../enums/ListingCategory'

export type ListingSort = 'recent' | 'price_asc' | 'price_desc' | 'area_desc'

export interface ListingFilters {
    category?: ListingCategory
    type?: string
    city?: string
    neighborhood?: string
    minPrice?: number
    maxPrice?: number
    /** Mínimo de quartos */
    bedrooms?: number
    /** Mínimo de vagas */
    parking?: number
    featured?: boolean
    /** Busca por título, bairro, cidade ou construtora (sem acento/maiúscula) */
    q?: string
}

export interface ListingFacets {
    categories: { category: ListingCategory, total: number }[]
    cities: { city: string, total: number }[]
    neighborhoods: { city: string, neighborhood: string, total: number }[]
    types: { type: string, total: number }[]
    price: { min: number | null, max: number | null }
}

/** Só anúncios publicados aparecem na vitrine. */
export interface ListingRepository {
    create(listing: Listing): Promise<Listing>
    /**
     * Cria o anúncio ou, se o endereço (slug) já existir, atualiza só o CONTEÚDO (textos, fotos, endereço, andamento).
     * Preço, destaque, situação de publicação e data de criação são preservados: podem ter sido ajustados à mão.
     */
    upsertBySlug(listing: Listing): Promise<{ listing: Listing, created: boolean }>
    findBySlug(slug: string): Promise<Listing | null>
    findMany(filters: ListingFilters, sort: ListingSort, pagination: PaginationParams): Promise<Paginated<Listing>>
    /** Outros anúncios parecidos (mesma categoria, preferindo a mesma cidade) */
    findRelated(listing: Listing, limit: number): Promise<Listing[]>
    facets(category?: ListingCategory): Promise<ListingFacets>
    /** Endereços dos anúncios publicados (sitemap) */
    listSlugs(): Promise<{ slug: string, updatedAt: Date }[]>
}

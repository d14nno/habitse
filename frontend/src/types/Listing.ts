export type CategoryKey = 'ready' | 'used' | 'off_plan' | 'under_construction'

export interface ListingCard {
    id: number
    slug: string
    title: string
    category: CategoryKey
    categoryLabel: string
    categorySlug: string
    type: string
    price: number | null
    city: string
    state: string
    neighborhood: string
    bedrooms: number
    suites: number
    bathrooms: number
    parking: number
    area: number | null
    cover: string | null
    photoCount: number
    developer: string | null
    /** YYYY-MM */
    deliveryDate: string | null
    constructionProgress: number | null
    featured: boolean
    /** Imóvel de permuta da Bambuí (selo no cartão); só no catálogo estático */
    permuta?: boolean
    /** Primeiras fotos, para passar no cartão (só no catálogo estático) */
    gallery?: string[]
}

export interface ListingDetail extends ListingCard {
    address: string | null
    description: string
    features: string[]
    photos: string[]
    updatedAt: string
    related: ListingCard[]
    /** Registro de incorporação e incorporador (publicidade de empreendimento); só no catálogo estático */
    incorporation?: string | null
    /** Observação sob o preço (tabela de origem e unidades disponíveis); só no catálogo estático */
    priceNote?: string | null
    /** Fotos da abertura do site: uma fachada e uma de lazer (só no catálogo estático) */
    hero?: string[]
}

export interface Paginated<T> {
    data: T[]
    pagination: { page: number, perPage: number, total: number, lastPage: number }
}

export interface Facets {
    categories: { category: CategoryKey, total: number }[]
    cities: { city: string, total: number }[]
    neighborhoods: { city: string, neighborhood: string, total: number }[]
    types: { type: string, total: number }[]
    price: { min: number | null, max: number | null }
    /** Só no catálogo estático: o que existe no cadastro e vira opção de filtro */
    features?: string[]
    deliveryYears?: number[]
}

export type Sort = 'recent' | 'price_asc' | 'price_desc' | 'area_desc'

/** Filtros da busca (também guardados na URL, para compartilhar e voltar com o botão do celular) */
export interface Filters {
    type?: string
    city?: string
    neighborhood?: string
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    parking?: number
    /** Área privativa mínima (m²) */
    minArea?: number
    /** Suítes (mínimo) */
    suites?: number
    /** Entrega prevista até o fim deste ano */
    deliveryUntil?: number
    /** Diferencial cadastrado (texto exato) */
    feature?: string
    q?: string
    sort?: Sort
}

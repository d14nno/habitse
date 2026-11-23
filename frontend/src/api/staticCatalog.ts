import type { CategoryKey, Facets, ListingCard, ListingDetail, Paginated, Sort } from '@/types/Listing'

/**
 * Catálogo estático: os empreendimentos vêm de `/data/empreendimentos.json` (gerado pela importação e publicado junto
 * com o site), sem depender da API. Aqui ficam as mesmas regras de filtro, ordenação, paginação e sugestões que a API
 * aplica no banco, para o resto do site não perceber a diferença.
 */
export type CatalogItem = Omit<ListingDetail, 'related'>

export interface Catalog {
    version: number
    items: CatalogItem[]
}

export interface CatalogQuery {
    category?: CategoryKey
    type?: string
    city?: string
    neighborhood?: string
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
    parking?: number
    featured?: boolean
    q?: string
    sort?: Sort
    page?: number
    perPage?: number
}

const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const byNullsLast = (pick: (item: CatalogItem) => number | null, direction: 1 | -1) => (a: CatalogItem, b: CatalogItem) => {
    const left = pick(a)
    const right = pick(b)

    if (left === null && right === null) return b.id - a.id
    if (left === null) return 1
    if (right === null) return -1

    return (left - right) * direction || b.id - a.id
}

const SORTS: Record<Sort, (a: CatalogItem, b: CatalogItem) => number> = {
    // Destaques primeiro, depois o que mudou há menos tempo
    recent: (a, b) => Number(b.featured) - Number(a.featured) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || b.id - a.id,
    price_asc: byNullsLast(item => item.price, 1),
    price_desc: byNullsLast(item => item.price, -1),
    area_desc: byNullsLast(item => item.area, -1)
}

export const toCard = ({ address: _address, description: _description, features: _features, photos: _photos, updatedAt: _updatedAt, incorporation: _incorporation, priceNote: _priceNote, ...card }: CatalogItem): ListingCard => card

export function listCatalog(catalog: Catalog, query: CatalogQuery): Paginated<ListingCard> {
    const needle = query.q ? fold(query.q) : null

    const matches = catalog.items.filter(item =>
        (!query.category || item.category === query.category)
        && (!query.type || item.type === query.type)
        && (!query.city || item.city === query.city)
        && (!query.neighborhood || item.neighborhood === query.neighborhood)
        && (query.minPrice === undefined || (item.price !== null && item.price >= query.minPrice))
        && (query.maxPrice === undefined || (item.price !== null && item.price <= query.maxPrice))
        && (query.bedrooms === undefined || item.bedrooms >= query.bedrooms)
        && (query.parking === undefined || item.parking >= query.parking)
        && (query.featured === undefined || item.featured === query.featured)
        && (!needle || fold([item.title, item.neighborhood, item.city, item.developer ?? ''].join(' ')).includes(needle)))

    const sorted = [...matches].sort(SORTS[query.sort ?? 'recent'])
    const perPage = Math.min(Math.max(query.perPage ?? 12, 1), 50)
    const lastPage = Math.max(1, Math.ceil(sorted.length / perPage))
    const page = Math.min(Math.max(query.page ?? 1, 1), lastPage)

    return { data: sorted.slice((page - 1) * perPage, page * perPage).map(toCard), pagination: { page, perPage, total: sorted.length, lastPage } }
}

export function getFromCatalog(catalog: Catalog, slug: string): ListingDetail | null {
    const item = catalog.items.find(candidate => candidate.slug === slug)
    if (!item) return null

    // Sugestões: mesma categoria, outro anúncio, preferindo a mesma cidade
    const related = catalog.items
        .filter(other => other.category === item.category && other.id !== item.id)
        .sort((a, b) => Number(b.city === item.city) - Number(a.city === item.city) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, 4)
        .map(toCard)

    return { ...item, related }
}

const count = <K extends string>(values: K[]) => {
    const totals = new Map<K, number>()
    values.forEach(value => totals.set(value, (totals.get(value) ?? 0) + 1))

    return Array.from(totals, ([value, total]) => ({ value, total })).sort((a, b) => b.total - a.total || a.value.localeCompare(b.value))
}

export function catalogFacets(catalog: Catalog, category?: CategoryKey): Facets {
    const scoped = category ? catalog.items.filter(item => item.category === category) : catalog.items
    const prices = scoped.map(item => item.price).filter((price): price is number => price !== null)

    const neighborhoods = new Map<string, { city: string, neighborhood: string, total: number }>()
    scoped.forEach(item => {
        const key = `${item.city}|${item.neighborhood}`
        neighborhoods.set(key, { city: item.city, neighborhood: item.neighborhood, total: (neighborhoods.get(key)?.total ?? 0) + 1 })
    })

    return {
        categories: count(catalog.items.map(item => item.category)).map(({ value, total }) => ({ category: value, total })),
        cities: count(scoped.map(item => item.city)).map(({ value, total }) => ({ city: value, total })),
        neighborhoods: Array.from(neighborhoods.values()).sort((a, b) => a.city.localeCompare(b.city) || a.neighborhood.localeCompare(b.neighborhood)),
        types: count(scoped.map(item => item.type)).map(({ value, total }) => ({ type: value, total })),
        price: { min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null }
    }
}

let loading: Promise<Catalog | null> | null = null

/** Lê o catálogo publicado com o site; null se não existir ou estiver vazio/inválido (aí o site usa a API) */
export function loadCatalog(url = `${import.meta.env.BASE_URL}data/empreendimentos.json`): Promise<Catalog | null> {
    loading ??= (async () => {
        try {
            const response = await fetch(url, { headers: { Accept: 'application/json' } })
            if (!response.ok) return null

            const body = await response.json()

            return body && Array.isArray(body.items) && body.items.length ? (body as Catalog) : null
        } catch {
            // Arquivo ausente: o site responde com index.html (HTML) e o JSON falha; rede fora do ar também cai aqui
            return null
        }
    })()

    return loading
}

/** Só para testes */
export const resetCatalogCache = () => {
    loading = null
}

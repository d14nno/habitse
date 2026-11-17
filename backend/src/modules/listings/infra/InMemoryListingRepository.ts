import { Paginated, PaginationParams } from '@shared/types/Pagination'
import { Listing } from '../entities/Listing'
import { ListingCategory } from '../enums/ListingCategory'
import { ListingFacets, ListingFilters, ListingRepository, ListingSort } from '../repositories/ListingRepository'

const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const sorters: Record<ListingSort, (a: Listing, b: Listing) => number> = {
    recent: (a, b) => Number(b.props.featured) - Number(a.props.featured) || b.props.createdAt.getTime() - a.props.createdAt.getTime() || b.id - a.id,
    price_asc: (a, b) => (a.props.price ?? Infinity) - (b.props.price ?? Infinity),
    price_desc: (a, b) => (b.props.price ?? -Infinity) - (a.props.price ?? -Infinity),
    area_desc: (a, b) => (b.props.area ?? 0) - (a.props.area ?? 0)
}

export class InMemoryListingRepository implements ListingRepository {
    public listings: Listing[] = []

    async create(listing: Listing): Promise<Listing> {
        const created = new Listing({ ...listing.props, id: this.listings.length + 1 })
        this.listings.push(created)
        return created
    }

    async findBySlug(slug: string): Promise<Listing | null> {
        return this.listings.find(item => item.slug === slug && item.isPublished) ?? null
    }

    async findMany(filters: ListingFilters, sort: ListingSort, { page, perPage }: PaginationParams): Promise<Paginated<Listing>> {
        const needle = filters.q ? fold(filters.q) : null
        const matches = this.listings.filter(({ props, isPublished }) => isPublished
            && (!filters.category || props.category === filters.category)
            && (!filters.type || props.type === filters.type)
            && (!filters.city || props.city === filters.city)
            && (!filters.neighborhood || props.neighborhood === filters.neighborhood)
            && (filters.minPrice === undefined || (props.price !== null && props.price >= filters.minPrice))
            && (filters.maxPrice === undefined || (props.price !== null && props.price <= filters.maxPrice))
            && (filters.bedrooms === undefined || props.bedrooms >= filters.bedrooms)
            && (filters.parking === undefined || props.parking >= filters.parking)
            && (filters.featured === undefined || props.featured === filters.featured)
            && (!needle || fold([props.title, props.neighborhood, props.city, props.developer ?? ''].join(' ')).includes(needle))
        ).sort(sorters[sort])

        return {
            data: matches.slice((page - 1) * perPage, page * perPage),
            pagination: { page, perPage, total: matches.length, lastPage: Math.max(1, Math.ceil(matches.length / perPage)) }
        }
    }

    async findRelated(listing: Listing, limit: number): Promise<Listing[]> {
        return this.listings
            .filter(item => item.isPublished && item.id !== listing.id && item.category === listing.category)
            .sort((a, b) => Number(b.props.city === listing.props.city) - Number(a.props.city === listing.props.city) || sorters.recent(a, b))
            .slice(0, limit)
    }

    async listSlugs() {
        return this.listings.filter(item => item.isPublished).map(item => ({ slug: item.slug, updatedAt: item.props.updatedAt }))
    }

    async facets(category?: ListingCategory): Promise<ListingFacets> {
        const published = this.listings.filter(item => item.isPublished)
        const scoped = category ? published.filter(item => item.category === category) : published
        const count = (items: Listing[], key: (item: Listing) => string) => {
            const map = new Map<string, number>()
            for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1)
            return Array.from(map.entries())
        }
        const prices = scoped.map(item => item.props.price).filter((price): price is number => price !== null)

        return {
            categories: count(published, item => item.category).map(([category, total]) => ({ category: category as ListingCategory, total })),
            cities: count(scoped, item => item.props.city).map(([city, total]) => ({ city, total })).sort((a, b) => a.city.localeCompare(b.city, 'pt-BR')),
            neighborhoods: count(scoped, item => `${item.props.city}|${item.props.neighborhood}`)
                .map(([key, total]) => ({ city: key.split('|')[0], neighborhood: key.split('|')[1], total }))
                .sort((a, b) => a.neighborhood.localeCompare(b.neighborhood, 'pt-BR')),
            types: count(scoped, item => item.props.type).map(([type, total]) => ({ type, total })),
            price: { min: prices.length ? Math.min(...prices) : null, max: prices.length ? Math.max(...prices) : null }
        }
    }
}

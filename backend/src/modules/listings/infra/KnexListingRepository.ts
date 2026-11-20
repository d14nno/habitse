import { Knex } from 'knex'

import { connection } from '@shared/infra/knex'
import { paginate } from '@shared/infra/knex/paginate'
import { Paginated, PaginationParams } from '@shared/types/Pagination'
import { Listing } from '../entities/Listing'
import { ListingCategory } from '../enums/ListingCategory'
import { ListingFacets, ListingFilters, ListingRepository, ListingSort } from '../repositories/ListingRepository'

const LISTINGS = 'listings.listings'

const toEntity = (row: any): Listing => new Listing({
    ...row,
    // numeric/decimal do Postgres chega como string
    price: row.price === null ? null : Number(row.price),
    area: row.area === null ? null : Number(row.area),
    features: row.features ?? [],
    photos: row.photos ?? []
})

const toRow = (listing: Listing) => {
    const { id, features, photos, ...rest } = listing.props
    return { ...(id ? { id } : {}), ...rest, features: JSON.stringify(features), photos: JSON.stringify(photos) }
}

/** Busca sem acento e sem diferença de maiúscula (sem depender da extensão unaccent) */
const FOLDED = 'translate(lower(concat_ws(\' \', "title", "neighborhood", "city", "developer")), \'áàâãäéèêëíìîïóòôõöúùûüç\', \'aaaaaeeeeiiiiooooouuuuc\')'

const ORDER: Record<ListingSort, string> = {
    recent: '"featured" desc, "createdAt" desc, "id" desc',
    // Preço "sob consulta" (nulo) vai para o fim em qualquer ordenação
    price_asc: '"price" asc nulls last, "id" desc',
    price_desc: '"price" desc nulls last, "id" desc',
    area_desc: '"area" desc nulls last, "id" desc'
}

export class KnexListingRepository implements ListingRepository {
    private published(): Knex.QueryBuilder {
        return connection(LISTINGS).where({ status: 'published' })
    }

    async create(listing: Listing): Promise<Listing> {
        const [row] = await connection(LISTINGS).insert(toRow(listing)).returning('*')
        return toEntity(row)
    }

    async upsertBySlug(listing: Listing): Promise<{ listing: Listing, created: boolean }> {
        const existing = await connection(LISTINGS).where({ slug: listing.slug }).first()

        if (!existing) return { listing: await this.create(listing), created: true }

        // Preço, destaque, situação, slug e criação ficam como estão
        const { id: _id, slug: _slug, price: _price, featured: _featured, status: _status, createdAt: _createdAt, ...content } = toRow(listing) as Record<string, unknown>
        const [row] = await connection(LISTINGS).where({ id: existing.id }).update({ ...content, updatedAt: new Date() }).returning('*')

        return { listing: toEntity(row), created: false }
    }

    async findBySlug(slug: string): Promise<Listing | null> {
        const row = await this.published().where({ slug }).first()
        return row ? toEntity(row) : null
    }

    async findMany(filters: ListingFilters, sort: ListingSort, pagination: PaginationParams): Promise<Paginated<Listing>> {
        const query = this.published().select('*')

        if (filters.category) query.where({ category: filters.category })
        if (filters.type) query.where({ type: filters.type })
        if (filters.city) query.where({ city: filters.city })
        if (filters.neighborhood) query.where({ neighborhood: filters.neighborhood })
        if (filters.minPrice !== undefined) query.where('price', '>=', filters.minPrice)
        if (filters.maxPrice !== undefined) query.where('price', '<=', filters.maxPrice)
        if (filters.bedrooms !== undefined) query.where('bedrooms', '>=', filters.bedrooms)
        if (filters.parking !== undefined) query.where('parking', '>=', filters.parking)
        if (filters.featured !== undefined) query.where({ featured: filters.featured })
        if (filters.q) {
            const needle = `%${filters.q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()}%`
            query.whereRaw(`${FOLDED} like ?`, [needle])
        }

        query.orderByRaw(ORDER[sort])

        const result = await paginate<any>(query, pagination)
        return { data: result.data.map(toEntity), pagination: result.pagination }
    }

    async findRelated(listing: Listing, limit: number): Promise<Listing[]> {
        const rows = await this.published()
            .where({ category: listing.category })
            .whereNot({ id: listing.id })
            .orderByRaw('("city" = ?) desc, "createdAt" desc', [listing.props.city])
            .limit(limit)
        return rows.map(toEntity)
    }

    async listSlugs() {
        const rows = await this.published().select('slug', 'updatedAt').orderBy('updatedAt', 'desc').limit(5000)
        return rows.map((row: any) => ({ slug: row.slug, updatedAt: row.updatedAt as Date }))
    }

    async facets(category?: ListingCategory): Promise<ListingFacets> {
        const scoped = () => (category ? this.published().where({ category }) : this.published())

        const [categories, cities, neighborhoods, types, [price]] = await Promise.all([
            this.published().select('category').count('* as total').groupBy('category'),
            scoped().select('city').count('* as total').groupBy('city').orderBy('city'),
            scoped().select('city', 'neighborhood').count('* as total').groupBy('city', 'neighborhood').orderBy('neighborhood'),
            scoped().select('type').count('* as total').groupBy('type').orderBy('type'),
            scoped().min('price as min').max('price as max')
        ])

        const number = (value: unknown) => (value === null || value === undefined ? null : Number(value))

        return {
            categories: categories.map((row: any) => ({ category: row.category, total: Number(row.total) })),
            cities: cities.map((row: any) => ({ city: row.city, total: Number(row.total) })),
            neighborhoods: neighborhoods.map((row: any) => ({ city: row.city, neighborhood: row.neighborhood, total: Number(row.total) })),
            types: types.map((row: any) => ({ type: row.type, total: Number(row.total) })),
            price: { min: number((price as any)?.min), max: number((price as any)?.max) }
        }
    }
}

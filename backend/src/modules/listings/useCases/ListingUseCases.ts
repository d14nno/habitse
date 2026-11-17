import { inject, injectable } from 'tsyringe'

import { Paginated, PaginationParams, mapPaginated } from '@shared/types/Pagination'
import { CATEGORY_INFO, ListingCategory } from '../enums/ListingCategory'
import { ListingErrors } from '../errors/ListingErrors'
import { ListingMapper } from '../mappers/ListingMapper'
import { ListingFilters, ListingRepository, ListingSort } from '../repositories/ListingRepository'

/** GET /listings — lista pública, filtrada e paginada no banco */
@injectable()
export class ListListingsUseCase {
    constructor(
        @inject('ListingRepository')
        private listingRepository: ListingRepository
    ) { }

    async execute(filters: ListingFilters, sort: ListingSort, pagination: PaginationParams): Promise<Paginated<ReturnType<typeof ListingMapper.toCard>>> {
        return mapPaginated(await this.listingRepository.findMany(filters, sort, pagination), ListingMapper.toCard)
    }
}

/** GET /listings/:slug — página do imóvel, com sugestões parecidas */
@injectable()
export class GetListingUseCase {
    constructor(
        @inject('ListingRepository')
        private listingRepository: ListingRepository
    ) { }

    async execute(slug: string) {
        const listing = await this.listingRepository.findBySlug(slug)
        if (!listing) throw ListingErrors.notFound()

        const related = await this.listingRepository.findRelated(listing, 4)
        return { ...ListingMapper.toDetail(listing), related: related.map(ListingMapper.toCard) }
    }
}

/** GET /listings/facets — opções dos filtros (cidades, bairros, tipos, faixa de preço) */
@injectable()
export class ListingFacetsUseCase {
    constructor(
        @inject('ListingRepository')
        private listingRepository: ListingRepository
    ) { }

    execute(category?: ListingCategory) {
        return this.listingRepository.facets(category)
    }
}

/** GET /sitemap.xml — páginas do site (início, categorias e cada imóvel publicado) para os buscadores */
@injectable()
export class SitemapUseCase {
    constructor(
        @inject('ListingRepository')
        private listingRepository: ListingRepository
    ) { }

    async execute(siteUrl: string): Promise<string> {
        const base = siteUrl.replace(/\/$/, '')
        const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        const entry = (path: string, lastmod?: Date) => `  <url><loc>${escape(base + path)}</loc>${lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : ''}</url>`

        const listings = await this.listingRepository.listSlugs()
        const pages = [
            entry('/'),
            ...Object.values(CATEGORY_INFO).map(category => entry(`/${category.slug}`)),
            ...listings.map(item => entry(`/imovel/${encodeURIComponent(item.slug)}`, item.updatedAt))
        ]

        return ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...pages, '</urlset>', ''].join(String.fromCharCode(10))
    }
}

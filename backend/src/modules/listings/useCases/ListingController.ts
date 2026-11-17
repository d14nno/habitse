import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { getPaginationParams, paginationQuerySchema } from '@shared/infra/validate/pagination'
import { Request, Response } from '@shared/types/Express'
import { LISTING_CATEGORIES, LISTING_TYPES } from '../enums/ListingCategory'
import { config } from '@shared/config'
import { ListingFacetsUseCase, GetListingUseCase, ListListingsUseCase, SitemapUseCase } from './ListingUseCases'

const SORTS = ['recent', 'price_asc', 'price_desc', 'area_desc'] as const

/** Vitrine pública: sem login. Só devolve anúncios publicados. */
export class ListingController {
    static async list(request: Request, response: Response): Promise<Response> {
        const { sort = 'recent', ...filters } = request.query as Record<string, any>
        return response.json(await container.resolve(ListListingsUseCase).execute(filters, sort, getPaginationParams(request.query)))
    }

    static async show(request: Request, response: Response): Promise<Response> {
        return response.json(await container.resolve(GetListingUseCase).execute(request.params.slug))
    }

    static async facets(request: Request, response: Response): Promise<Response> {
        return response.json(await container.resolve(ListingFacetsUseCase).execute(request.query.category as any))
    }

    static async sitemap(_request: Request, response: Response): Promise<Response> {
        const xml = await container.resolve(SitemapUseCase).execute(config.get('application.siteUrl'))
        return response.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml)
    }

    static validateList = validate({
        [Segments.QUERY]: Joi.object().keys({
            ...paginationQuerySchema,
            category: Joi.string().valid(...LISTING_CATEGORIES),
            type: Joi.string().valid(...LISTING_TYPES),
            city: Joi.string().trim().max(80),
            neighborhood: Joi.string().trim().max(80),
            minPrice: Joi.number().min(0),
            maxPrice: Joi.number().min(0),
            bedrooms: Joi.number().integer().min(0).max(10),
            parking: Joi.number().integer().min(0).max(10),
            featured: Joi.boolean(),
            q: Joi.string().trim().max(80).allow(''),
            sort: Joi.string().valid(...SORTS)
        })
    })

    static validateShow = validate({
        [Segments.PARAMS]: Joi.object().keys({ slug: Joi.string().trim().max(160).required() })
    })

    static validateFacets = validate({
        [Segments.QUERY]: Joi.object().keys({ category: Joi.string().valid(...LISTING_CATEGORIES) })
    })
}

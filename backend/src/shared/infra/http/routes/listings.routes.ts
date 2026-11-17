import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { ListingController } from '@modules/listings/useCases/ListingController'

/** Vitrine pública (sem login). Leitura apenas; o limite protege contra varredura do catálogo. */
const publicLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 240,
    standardHeaders: true,
    message: { errors: [{ message: 'Muitas requisições, tente novamente em instantes', uniqueCode: 'RATE_LIMIT' }] }
})

const ListingRoutes = Router()

ListingRoutes.use(publicLimiter)

// /facets antes de /:slug para não ser lido como slug
ListingRoutes.get('/facets', ListingController.validateFacets, ListingController.facets)
ListingRoutes.get('/', ListingController.validateList, ListingController.list)
ListingRoutes.get('/:slug', ListingController.validateShow, ListingController.show)

export { ListingRoutes }

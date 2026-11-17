import { container } from 'tsyringe'
import { KnexListingRepository } from '@modules/listings/infra/KnexListingRepository'
import { ListingRepository } from '@modules/listings/repositories/ListingRepository'

container.registerSingleton<ListingRepository>('ListingRepository', KnexListingRepository)

import { container } from 'tsyringe'
import { KnexListingRepository } from '@modules/listings/infra/KnexListingRepository'
import { KnexPermutaRepository } from '@modules/listings/infra/KnexPermutaRepository'
import { ListingRepository } from '@modules/listings/repositories/ListingRepository'
import { PermutaRepository } from '@modules/listings/repositories/PermutaRepository'

container.registerSingleton<ListingRepository>('ListingRepository', KnexListingRepository)
container.registerSingleton<PermutaRepository>('PermutaRepository', KnexPermutaRepository)

import { AppError } from '@shared/utils/AppError'

export const ListingErrors = {
    notFound: () => new AppError([{ message: 'Imóvel não encontrado', uniqueCode: 'LISTING:NOT_FOUND' }], 404)
}

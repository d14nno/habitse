import 'reflect-metadata'

import { expectAppError } from '@shared/tests/expectAppError'
import { Listing } from '../entities/Listing'
import { ListingCategory } from '../enums/ListingCategory'
import { InMemoryListingRepository } from '../infra/InMemoryListingRepository'
import { GetListingUseCase, ListingFacetsUseCase, ListListingsUseCase } from './ListingUseCases'

const make = (overrides: Partial<Parameters<typeof Listing.create>[0]> = {}) => Listing.create({
    slug: 'imovel', title: 'Apartamento', category: ListingCategory.USED, type: 'apartamento', status: 'published', price: 500000,
    city: 'Goiânia', neighborhood: 'Setor Bueno', state: 'GO', address: null, bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 70,
    description: '', features: [], photos: ['/a.svg'], developer: null, deliveryDate: null, constructionProgress: null, featured: false,
    ...overrides
})

describe('Vitrine de imóveis', () => {
    let repository: InMemoryListingRepository
    let list: ListListingsUseCase
    const page = { page: 1, perPage: 20 }

    beforeEach(async () => {
        repository = new InMemoryListingRepository()
        list = new ListListingsUseCase(repository)
        await repository.create(make({ slug: 'a', title: 'Apartamento no Setor Bueno', price: 600000, bedrooms: 3, parking: 2, area: 90 }))
        await repository.create(make({ slug: 'b', title: 'Lançamento Horizonte', category: ListingCategory.OFF_PLAN, price: 900000, deliveryDate: '2029-12', developer: 'Construtora X', bedrooms: 3, area: 110, featured: true }))
        await repository.create(make({ slug: 'c', title: 'Obra Pôr do Sol', category: ListingCategory.UNDER_CONSTRUCTION, price: null, constructionProgress: 40, deliveryDate: '2027-05', city: 'Aparecida de Goiânia', neighborhood: 'Jardim Europa' }))
        await repository.create(make({ slug: 'd', title: 'Rascunho', status: 'draft' }))
    })

    it('só lista anúncios publicados', async () => {
        const result = await list.execute({}, 'recent', page)
        expect(result.pagination.total).toBe(3)
        expect(result.data.map(item => item.slug)).not.toContain('d')
    })

    it('filtra por categoria, quartos mínimos e faixa de preço', async () => {
        expect((await list.execute({ category: ListingCategory.OFF_PLAN }, 'recent', page)).data.map(item => item.slug)).toEqual(['b'])
        expect((await list.execute({ bedrooms: 3 }, 'recent', page)).data).toHaveLength(2)
        expect((await list.execute({ minPrice: 700000, maxPrice: 1000000 }, 'recent', page)).data.map(item => item.slug)).toEqual(['b'])
    })

    it('busca sem diferenciar acento e maiúscula', async () => {
        expect((await list.execute({ q: 'por do sol' }, 'recent', page)).data.map(item => item.slug)).toEqual(['c'])
        expect((await list.execute({ q: 'LANCAMENTO' }, 'recent', page)).data.map(item => item.slug)).toEqual(['b'])
    })

    it('ordena por preço com "sob consulta" no fim e destaque primeiro na ordem padrão', async () => {
        expect((await list.execute({}, 'price_asc', page)).data.map(item => item.slug)).toEqual(['a', 'b', 'c'])
        expect((await list.execute({}, 'price_desc', page)).data.map(item => item.slug)).toEqual(['b', 'a', 'c'])
        expect((await list.execute({}, 'recent', page)).data[0].slug).toBe('b')
    })

    it('pagina o resultado', async () => {
        const result = await list.execute({}, 'recent', { page: 2, perPage: 2 })
        expect(result.data).toHaveLength(1)
        expect(result.pagination).toMatchObject({ page: 2, total: 3, lastPage: 2 })
    })

    it('o cartão leva a capa e a categoria; andamento só existe em obra', async () => {
        const cards = (await list.execute({}, 'recent', page)).data
        expect(cards.find(item => item.slug === 'a')).toMatchObject({ cover: '/a.svg', categoryLabel: 'Oportunidades de mercado', categorySlug: 'oportunidades', constructionProgress: null, deliveryDate: null })
        expect(cards.find(item => item.slug === 'c')).toMatchObject({ categorySlug: 'em-construcao', constructionProgress: 40, price: null })
    })

    it('detalhe traz fotos, descrição e sugestões da mesma categoria; rascunho ou inexistente dá 404', async () => {
        const detail = await new GetListingUseCase(repository).execute('a')
        expect(detail).toMatchObject({ slug: 'a', photos: ['/a.svg'] })
        expect(detail.related).toEqual([])

        await expectAppError(new GetListingUseCase(repository).execute('d'), 'LISTING:NOT_FOUND', 404)
        await expectAppError(new GetListingUseCase(repository).execute('nada'), 'LISTING:NOT_FOUND', 404)
    })

    it('opções de filtro respeitam a categoria escolhida', async () => {
        const all = await new ListingFacetsUseCase(repository).execute()
        expect(all.categories).toHaveLength(3)
        expect(all.cities.map(item => item.city)).toEqual(['Aparecida de Goiânia', 'Goiânia'])

        const scoped = await new ListingFacetsUseCase(repository).execute(ListingCategory.UNDER_CONSTRUCTION)
        expect(scoped.cities).toEqual([{ city: 'Aparecida de Goiânia', total: 1 }])
        expect(scoped.price).toEqual({ min: null, max: null })
    })
})

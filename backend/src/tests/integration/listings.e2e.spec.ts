import 'reflect-metadata'
import request from 'supertest'
import { container } from 'tsyringe'

import Application from '@shared/infra/http/app'
import { connection } from '@shared/infra/knex'
import { getRedisClient } from '@shared/infra/redis'
import { Listing } from '@modules/listings/entities/Listing'
import { ListingCategory } from '@modules/listings/enums/ListingCategory'
import { ListingRepository } from '@modules/listings/repositories/ListingRepository'

/** Vitrine pela API real (rotas públicas, validação e Postgres). */
const app = Application.express

const make = (slug: string, overrides: Partial<Parameters<typeof Listing.create>[0]> = {}) => Listing.create({
    slug, title: `Imóvel ${slug}`, category: ListingCategory.USED, type: 'apartamento', status: 'published', price: 500000,
    city: 'Goiânia', neighborhood: 'Setor Bueno', state: 'GO', address: null, bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 70,
    description: 'Descrição', features: ['Piscina'], photos: ['/a.svg', '/b.svg'], developer: null, deliveryDate: null, constructionProgress: null, featured: false,
    ...overrides
})

describe('Vitrine (integração)', () => {
    afterAll(async () => {
        await connection.destroy()
        getRedisClient().disconnect()
    })

    beforeAll(async () => {
        // O banco de teste já recebe os anúncios de exemplo do seed: aqui o catálogo é controlado
        await connection('listings.listings').del()
        const repository = container.resolve<ListingRepository>('ListingRepository')
        await repository.create(make('usado-1', { title: 'Apartamento no Setor Bueno', price: 650000, bedrooms: 3 }))
        await repository.create(make('planta-1', { category: ListingCategory.OFF_PLAN, title: 'Lançamento Horizonte', developer: 'Construtora X', deliveryDate: '2029-12', price: 900000 }))
        await repository.create(make('obra-1', { category: ListingCategory.UNDER_CONSTRUCTION, title: 'Obra Pôr do Sol', constructionProgress: 62, deliveryDate: '2027-08', price: null }))
        await repository.create(make('rascunho-1', { status: 'draft' }))
    })

    it('lista só os publicados, com filtro por categoria e paginação', async () => {
        const all = await request(app).get('/listings')
        expect(all.status).toBe(200)
        expect(all.body.pagination.total).toBe(3)

        const planta = await request(app).get('/listings').query({ category: 'off_plan' })
        expect(planta.body.data.map((item: any) => item.slug)).toEqual(['planta-1'])
        expect(planta.body.data[0]).toMatchObject({ categorySlug: 'na-planta', developer: 'Construtora X', deliveryDate: '2029-12' })

        const paged = await request(app).get('/listings').query({ perPage: 2, page: 2 })
        expect(paged.body.data).toHaveLength(1)
    })

    it('busca sem acento, filtra por quartos e ordena com "sob consulta" no fim', async () => {
        expect((await request(app).get('/listings').query({ q: 'por do sol' })).body.data.map((item: any) => item.slug)).toEqual(['obra-1'])
        expect((await request(app).get('/listings').query({ bedrooms: 3 })).body.data.map((item: any) => item.slug)).toEqual(['usado-1'])
        expect((await request(app).get('/listings').query({ sort: 'price_asc' })).body.data.map((item: any) => item.slug)).toEqual(['usado-1', 'planta-1', 'obra-1'])
    })

    it('detalhe com fotos e sugestões; rascunho e inexistente dão 404', async () => {
        const detail = await request(app).get('/listings/obra-1')
        expect(detail.status).toBe(200)
        expect(detail.body).toMatchObject({ slug: 'obra-1', constructionProgress: 62, photos: ['/a.svg', '/b.svg'], price: null })
        expect(Array.isArray(detail.body.related)).toBe(true)

        for (const slug of ['rascunho-1', 'nao-existe']) {
            const response = await request(app).get(`/listings/${slug}`)
            expect(response.status).toBe(404)
            expect(response.body.errors[0].uniqueCode).toBe('LISTING:NOT_FOUND')
        }
    })

    it('opções dos filtros e validação dos parâmetros', async () => {
        const facets = await request(app).get('/listings/facets')
        expect(facets.status).toBe(200)
        expect(facets.body.categories).toHaveLength(3)
        expect(facets.body.price).toEqual({ min: 650000, max: 900000 })

        expect((await request(app).get('/listings').query({ category: 'inexistente' })).status).toBe(400)
        expect((await request(app).get('/listings').query({ perPage: 1000 })).status).toBe(400)
    })
})

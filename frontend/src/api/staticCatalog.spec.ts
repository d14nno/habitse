import { afterEach, describe, expect, it, vi } from 'vitest'

import { catalogFacets, getFromCatalog, listCatalog, loadCatalog, resetCatalogCache, type Catalog, type CatalogItem } from './staticCatalog'

const item = (id: number, extra: Partial<CatalogItem> = {}): CatalogItem => ({
    id, slug: `imovel-${id}`, title: `Imóvel ${id}`, category: 'under_construction', categoryLabel: 'Em construção', categorySlug: 'em-construcao', type: 'apartamento',
    price: null, city: 'Goiânia', state: 'GO', neighborhood: 'Setor Marista', bedrooms: 3, suites: 3, bathrooms: 0, parking: 0, area: 100, cover: 'https://x.test/c.jpg', photoCount: 2,
    developer: 'Bambuí', deliveryDate: null, constructionProgress: 30, featured: false, address: 'Rua 1', description: 'Texto', features: [], photos: ['https://x.test/c.jpg'],
    updatedAt: '2026-11-20T10:00:00.000Z', incorporation: null, ...extra
})

const catalog: Catalog = {
    version: 1,
    items: [
        item(1, { title: 'Praça 232', price: 1450000, area: 151, featured: true, neighborhood: 'Jardim América' }),
        item(2, { title: 'Marista 262', price: 2300000, area: 118, bedrooms: 3, parking: 2 }),
        item(3, { title: 'Areião 1141', category: 'off_plan', categoryLabel: 'Na planta', categorySlug: 'na-planta', price: null, area: 78, bedrooms: 2, constructionProgress: null, updatedAt: '2026-11-21T10:00:00.000Z' }),
        item(4, { title: 'Casa Aparecida', category: 'off_plan', categoryLabel: 'Na planta', categorySlug: 'na-planta', type: 'casa', city: 'Aparecida de Goiânia', neighborhood: 'Jardins Atenas', price: 900000, area: 210, developer: 'Outra' })
    ]
}

describe('catálogo estático: mesmas regras da API', () => {
    it('filtra por categoria, tipo, cidade, bairro, preço, quartos, vagas e destaque; o card não leva os campos do detalhe', () => {
        expect(listCatalog(catalog, { category: 'under_construction' }).data.map(card => card.slug)).toEqual(['imovel-1', 'imovel-2'])
        expect(listCatalog(catalog, { type: 'casa' }).data.map(card => card.slug)).toEqual(['imovel-4'])
        expect(listCatalog(catalog, { city: 'Aparecida de Goiânia' }).pagination.total).toBe(1)
        expect(listCatalog(catalog, { neighborhood: 'Jardim América' }).data[0].slug).toBe('imovel-1')
        expect(listCatalog(catalog, { minPrice: 1000000, maxPrice: 2000000 }).data.map(card => card.slug)).toEqual(['imovel-1'])
        expect(listCatalog(catalog, { bedrooms: 3 }).pagination.total).toBe(3)
        expect(listCatalog(catalog, { parking: 1 }).data.map(card => card.slug)).toEqual(['imovel-2'])
        expect(listCatalog(catalog, { featured: true }).pagination.total).toBe(1)

        const [card] = listCatalog(catalog, { featured: true }).data
        expect(card).not.toHaveProperty('description')
        expect(card).not.toHaveProperty('photos')
        expect(card).not.toHaveProperty('incorporation')
        expect(card).toHaveProperty('cover')
    })

    it('preço "sob consulta" não passa em filtro de preço e vai para o fim nas ordenações por valor', () => {
        expect(listCatalog(catalog, { minPrice: 0 }).data.map(card => card.slug)).not.toContain('imovel-3')
        expect(listCatalog(catalog, { sort: 'price_asc' }).data.map(card => card.slug)).toEqual(['imovel-4', 'imovel-1', 'imovel-2', 'imovel-3'])
        expect(listCatalog(catalog, { sort: 'price_desc' }).data.map(card => card.slug)).toEqual(['imovel-2', 'imovel-1', 'imovel-4', 'imovel-3'])
        expect(listCatalog(catalog, { sort: 'area_desc' }).data.map(card => card.slug)).toEqual(['imovel-4', 'imovel-1', 'imovel-2', 'imovel-3'])
    })

    it('ordem padrão: destaque primeiro, depois o atualizado mais recentemente', () => {
        expect(listCatalog(catalog, {}).data.map(card => card.slug)).toEqual(['imovel-1', 'imovel-3', 'imovel-4', 'imovel-2'])
    })

    it('busca sem diferenciar acento nem maiúscula (título, bairro, cidade, construtora)', () => {
        expect(listCatalog(catalog, { q: 'praca' }).data.map(card => card.slug)).toEqual(['imovel-1'])
        expect(listCatalog(catalog, { q: 'AREIAO' }).data.map(card => card.slug)).toEqual(['imovel-3'])
        expect(listCatalog(catalog, { q: 'jardins atenas' }).data.map(card => card.slug)).toEqual(['imovel-4'])
        expect(listCatalog(catalog, { q: 'outra' }).data.map(card => card.slug)).toEqual(['imovel-4'])
        expect(listCatalog(catalog, { q: 'nada disso' }).pagination.total).toBe(0)
    })

    it('pagina: limites da página e da quantidade por página', () => {
        const result = listCatalog(catalog, { page: 2, perPage: 3 })

        expect(result.pagination).toEqual({ page: 2, perPage: 3, total: 4, lastPage: 2 })
        expect(result.data).toHaveLength(1)
        expect(listCatalog(catalog, { page: 99, perPage: 2 }).pagination.page).toBe(2)
        expect(listCatalog(catalog, { perPage: 999 }).pagination.perPage).toBe(50)
    })

    it('detalhe traz o registro de incorporação e sugere da mesma categoria, preferindo a mesma cidade', () => {
        const withRegistry: Catalog = { ...catalog, items: catalog.items.map(candidate => (candidate.id === 1 ? { ...candidate, incorporation: 'R-3, matrícula 12.345' } : candidate)) }
        const detail = getFromCatalog(withRegistry, 'imovel-1')

        expect(detail?.incorporation).toBe('R-3, matrícula 12.345')
        expect(detail?.related.map(card => card.slug)).toEqual(['imovel-2'])
        expect(getFromCatalog(catalog, 'imovel-4')?.related.map(card => card.slug)).toEqual(['imovel-3'])
        expect(getFromCatalog(catalog, 'nao-existe')).toBeNull()
    })

    it('opções de filtro respeitam a categoria; faixa de preço ignora "sob consulta"', () => {
        const all = catalogFacets(catalog)
        expect(all.categories).toEqual(expect.arrayContaining([{ category: 'under_construction', total: 2 }, { category: 'off_plan', total: 2 }]))
        expect(all.categories).toHaveLength(2)
        expect(all.price).toEqual({ min: 900000, max: 2300000 })

        const planta = catalogFacets(catalog, 'off_plan')
        expect(planta.cities.map(city => city.city).sort()).toEqual(['Aparecida de Goiânia', 'Goiânia'])
        expect(planta.types.map(type => type.type).sort()).toEqual(['apartamento', 'casa'])
        expect(planta.price).toEqual({ min: 900000, max: 900000 })
        expect(planta.categories).toHaveLength(2)
    })
})

describe('loadCatalog', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        resetCatalogCache()
    })

    it('carrega o arquivo publicado com o site e guarda em memória (uma só busca)', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => catalog })
        vi.stubGlobal('fetch', fetchMock)

        expect((await loadCatalog('/data/x.json'))?.items).toHaveLength(4)
        await loadCatalog('/data/x.json')
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('ausente, vazio ou inválido vira null (o site usa a API); o site responde index.html no lugar do JSON que não existe', async () => {
        for (const response of [
            { ok: false, json: async () => ({}) },
            { ok: true, json: async () => ({ version: 1, items: [] }) },
            { ok: true, json: async () => { throw new SyntaxError('Unexpected token <') } }
        ]) {
            resetCatalogCache()
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
            expect(await loadCatalog('/data/x.json')).toBeNull()
        }

        resetCatalogCache()
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('rede')))
        expect(await loadCatalog('/data/x.json')).toBeNull()
    })
})

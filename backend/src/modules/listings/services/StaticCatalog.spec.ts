import { Listing } from '../entities/Listing'
import { ListingCategory } from '../enums/ListingCategory'
import { adjustmentsFromPhotos, adjustmentsFromTables, applyAdjustment, buildCatalog, buildSitemap, catalogToJson, mergeAdjustments, validateAdjustments } from './StaticCatalog'

const listing = (slug: string, extra: Partial<Listing['props']> = {}) => Listing.create({
    slug, title: slug, category: ListingCategory.UNDER_CONSTRUCTION, type: 'apartamento', status: 'published', price: null, city: 'Goiânia', state: 'GO', neighborhood: 'Setor Marista', address: 'Rua 1',
    bedrooms: 3, suites: 3, bathrooms: 0, parking: 0, area: 100, description: 'Texto', features: [], photos: ['https://x.test/1.jpg'], developer: 'Bambuí', deliveryDate: null, constructionProgress: 30, featured: false, ...extra
})

describe('validação do arquivo de ajustes (editado à mão)', () => {
    it('aceita preço, entrega, registro, destaque e situação', () => {
        const { errors, adjustments } = validateAdjustments({ 'praca-232': { price: 1450000, deliveryDate: '2028-12', incorporation: 'R-3, matrícula 1', featured: true, status: 'published' }, 'vox-home': { price: null } })

        expect(errors).toEqual([])
        expect(Object.keys(adjustments)).toEqual(['praca-232', 'vox-home'])
    })

    it('aponta cada erro com o empreendimento e o campo, em português, e não devolve ajuste nenhum', () => {
        const { errors, adjustments } = validateAdjustments({
            a: { price: '1450000' }, b: { deliveryDate: '12/2028' }, c: { precoo: 1 }, d: { status: 'publicado' }, e: { bedrooms: 2.5 }, f: { featured: 'sim' }, g: 'texto', h: { photos: ['ftp://x'] }
        })

        expect(errors).toEqual(expect.arrayContaining([
            expect.stringMatching(/^a\.price: use um número/), expect.stringMatching(/^b\.deliveryDate: use AAAA-MM/), expect.stringMatching(/^c\.precoo: campo desconhecido/),
            expect.stringMatching(/^d\.status: use published, draft, sold/), expect.stringMatching(/^e\.bedrooms: use um número inteiro/), expect.stringMatching(/^f\.featured: use true ou false/),
            expect.stringMatching(/^g: precisa ser um objeto/), expect.stringMatching(/^h\.photos: use uma lista/)
        ]))
        expect(adjustments).toEqual({})
        expect(validateAdjustments([]).errors).toHaveLength(1)
        expect(validateAdjustments(null).errors).toHaveLength(1)
    })
})

describe('catálogo estático', () => {
    it('aplica os ajustes por cima do que veio do site e leva o registro de incorporação', () => {
        const { listing: adjusted, incorporation } = applyAdjustment(listing('praca-232'), { price: 1450000, deliveryDate: '2028-12', incorporation: 'R-3, matrícula 1', featured: true })

        expect(adjusted.props).toMatchObject({ price: 1450000, deliveryDate: '2028-12', featured: true })
        expect(incorporation).toBe('R-3, matrícula 1')
        expect(applyAdjustment(listing('x'), undefined).incorporation).toBeNull()
    })

    it('só entram publicados (rascunho fica de fora), em ordem de endereço, com ids estáveis e o registro no item', () => {
        const catalog = buildCatalog(
            [listing('praca-232'), listing('vox-home', { status: 'draft' }), listing('areiao-1141', { category: ListingCategory.OFF_PLAN })],
            { 'praca-232': { incorporation: 'R-3' }, 'vox-home': { status: 'published', price: 1380000 } },
            null
        )

        expect(catalog.items.map(item => [item.id, item.slug])).toEqual([[1, 'areiao-1141'], [2, 'praca-232'], [3, 'vox-home']])
        expect(catalog.items[1]).toMatchObject({ incorporation: 'R-3', categoryLabel: 'Em construção' })
        expect(catalog.items[2]).toMatchObject({ price: 1380000, incorporation: null })
        expect(catalog.items[0]).toHaveProperty('photos')
        expect(buildCatalog([listing('a', { status: 'draft' }), listing('b', { status: 'sold' })], {}, null).items).toEqual([])
    })

    it('updatedAt só muda quando o conteúdo muda (a rotina diária não gera commit à toa)', () => {
        const first = buildCatalog([listing('praca-232'), listing('marista-262')], {}, null, new Date('2026-11-20T10:00:00Z'))
        const again = buildCatalog([listing('praca-232'), listing('marista-262')], {}, first, new Date('2026-11-21T10:00:00Z'))

        expect(catalogToJson(again)).toBe(catalogToJson(first))

        const changed = buildCatalog([listing('praca-232', { constructionProgress: 45 }), listing('marista-262')], {}, first, new Date('2026-11-22T10:00:00Z'))
        expect(changed.items.find(item => item.slug === 'praca-232')?.updatedAt).toBe('2026-11-22T10:00:00.000Z')
        expect(changed.items.find(item => item.slug === 'marista-262')?.updatedAt).toBe('2026-11-20T10:00:00.000Z')
    })

    it('sitemap com início, categorias e cada empreendimento publicado', () => {
        const catalog = buildCatalog([listing('praca-232')], {}, null, new Date('2026-11-20T10:00:00Z'))
        const xml = buildSitemap(catalog, 'https://habitse.com.br/')

        expect(xml).toContain('<loc>https://habitse.com.br/</loc>')
        expect(xml).toContain('<loc>https://habitse.com.br/em-construcao</loc>')
        expect(xml).toContain('<loc>https://habitse.com.br/imovel/praca-232</loc><lastmod>2026-11-20</lastmod>')
    })
})

describe('preço e registro vindos das tabelas do Drive', () => {
    const info = { month: '2026-11', priceFrom: 1784700, availableCount: 40, keysDate: '2028-03', registry: 'R-3-379.445 no Cartório X' }

    it('viram ajustes; o que foi editado à mão vale mais, e o que não foi editado vem da tabela', () => {
        const fromTables = adjustmentsFromTables({ 'praca-232': info, 'vox-home': { ...info, keysDate: null, registry: null } }, new Date(2026, 10, 25))

        expect(fromTables['praca-232']).toEqual({ price: 1784700, priceNote: 'Tabela de novembro de 2026 · 40 unidades disponíveis', deliveryDate: '2028-03', incorporation: 'R-3-379.445 no Cartório X' })
        expect(fromTables['vox-home']).not.toHaveProperty('incorporation')

        const merged = mergeAdjustments(fromTables, { 'praca-232': { price: 1800000, featured: true, incorporation: undefined }, 'marista-262': { featured: true } })

        expect(merged['praca-232']).toMatchObject({ price: 1800000, featured: true, deliveryDate: '2028-03', incorporation: 'R-3-379.445 no Cartório X' })
        expect(merged['marista-262']).toEqual({ featured: true })
    })

    it('tabela com mais de dois meses não vale (o preço volta a "sob consulta")', () => {
        expect(adjustmentsFromTables({ 'praca-232': info }, new Date(2027, 1, 2))).toEqual({})
    })

    it('o catálogo leva a observação do preço e marca os anúncios de permuta', () => {
        const catalog = buildCatalog([listing('praca-232'), listing('permuta-gran-campinas', { category: ListingCategory.USED })], { 'praca-232': { price: 1784700, priceNote: 'Tabela de novembro de 2026 · 40 unidades disponíveis' } }, null)

        expect(catalog.items.map(item => [item.slug, item.permuta, item.priceNote])).toEqual([['permuta-gran-campinas', true, null], ['praca-232', false, 'Tabela de novembro de 2026 · 40 unidades disponíveis']])
        expect(validateAdjustments({ a: { priceNote: 5 } }).errors[0]).toMatch(/^a\.priceNote: use um texto/)
    })
})

describe('fotos copiadas do Drive', () => {
    it('viram a galeria do anúncio, e as fotos escolhidas à mão nos ajustes valem mais', () => {
        const fromPhotos = adjustmentsFromPhotos({ 'praca-232': [{ file: '/fotos/praca-232/01.jpg' }, { file: '/fotos/praca-232/02.jpg' }], vazio: [] })

        expect(fromPhotos).toEqual({ 'praca-232': { photos: ['/fotos/praca-232/01.jpg', '/fotos/praca-232/02.jpg'] } })

        const withTags = adjustmentsFromPhotos({ 'praca-232': [{ file: '/a.jpg', tag: 'fachada' }, { file: '/b.jpg', tag: '' }, { file: '/c.jpg', tag: 'lazer' }, { file: '/d.jpg', tag: 'lazer' }], x: [{ file: '/z.jpg', tag: '' }] })
        expect(withTags['praca-232'].hero).toEqual(['/a.jpg', '/c.jpg'])
        expect(withTags.x.hero).toBeUndefined()
        expect(buildCatalog([listing('praca-232')], withTags, null).items[0].hero).toEqual(['/a.jpg', '/c.jpg'])
        expect(buildCatalog([listing('praca-232')], {}, null).items[0].hero).toEqual([])
        expect(mergeAdjustments(fromPhotos, { 'praca-232': { photos: ['/outra.jpg'] } })['praca-232'].photos).toEqual(['/outra.jpg'])
        expect(buildCatalog([listing('praca-232')], fromPhotos, null).items[0]).toMatchObject({ cover: '/fotos/praca-232/01.jpg', photoCount: 2 })
    })
})

describe('bairros escritos de jeitos diferentes', () => {
    it('ficam com a grafia acentuada, para não duplicar na lista de bairros', () => {
        const catalog = buildCatalog([listing('praca-232', { neighborhood: 'Jardim America', city: 'Goiania' }), listing('permuta-palco', { neighborhood: 'Jardim América', category: ListingCategory.USED })], {}, null)

        expect(catalog.items.map(item => [item.neighborhood, item.city])).toEqual([['Jardim América', 'Goiânia'], ['Jardim América', 'Goiânia']].map(([n]) => [n, expect.any(String)]))
        expect(new Set(catalog.items.map(item => item.neighborhood)).size).toBe(1)
    })
})

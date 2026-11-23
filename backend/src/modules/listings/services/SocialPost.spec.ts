import { buildCaption, deliveryText, facts, formatMoney, hashtags, pickSlidePhotos, priceLine } from './SocialPost'
import { CatalogItem } from './StaticCatalog'

const item = (extra: Record<string, unknown> = {}) => ({
    slug: 'praca-232', title: 'Praça 232 — 3 suítes', category: 'under_construction', neighborhood: 'Jardim América', city: 'Goiânia',
    price: 1784700, area: 120.5, suites: 3, bedrooms: 3, parking: 2, deliveryDate: '2028-03', photos: ['/a.jpg', '/b.jpg', '/a.jpg'], ...extra
}) as unknown as CatalogItem

describe('posts para as redes', () => {
    it('preço: "a partir de" nos empreendimentos, valor direto no usado, nada sem valor', () => {
        expect(formatMoney(1784700)).toBe('R$ 1.784.700')
        expect(priceLine(item())).toBe('a partir de R$ 1.784.700')
        expect(priceLine(item({ category: 'used', price: 930000 }))).toBe('R$ 930.000')
        expect(priceLine(item({ price: null }))).toBeNull()
    })

    it('características e entrega', () => {
        expect(facts(item())).toBe('120,5 m² · 3 suítes · 2 vagas')
        expect(facts(item({ suites: 0, bedrooms: 1, parking: 0 }))).toBe('120,5 m² · 1 quarto')
        expect(deliveryText('2028-03')).toBe('mar/2028')
        expect(deliveryText(null)).toBeNull()
    })

    it('hashtags sem acento e sem repetição', () => {
        expect(hashtags(item())).toBe('#jardimamerica #goiania #emconstrucao #imoveis #imoveisdealtopadrao #habitse')
    })

    it('a legenda leva dados, contato, CRECI, aviso e não cita permuta', () => {
        const caption = buildCaption(item())

        expect(caption).toContain('Praça 232 — 3 suítes')
        expect(caption).toContain('a partir de R$ 1.784.700')
        expect(caption).toContain('Entrega mar/2028')
        expect(caption).toContain('(62) 99832-2361')
        expect(caption).toContain('https://habitse.com.br/imovel/praca-232')
        expect(caption).toContain('CRECI 49.743/GO')
        expect(caption).toContain('Imagens ilustrativas')
        expect(caption).not.toMatch(/permuta/i)
    })

    it('usado não mostra entrega', () => {
        expect(buildCaption(item({ category: 'used', deliveryDate: '2028-03' }))).not.toContain('Entrega')
    })

    it('fotos do carrossel: sem repetir e no máximo o limite', () => {
        expect(pickSlidePhotos(item())).toEqual(['/a.jpg', '/b.jpg'])
        expect(pickSlidePhotos(item({ photos: ['1', '2', '3', '4', '5', '6', '7'] }), 3)).toEqual(['1', '2', '3'])
    })
})

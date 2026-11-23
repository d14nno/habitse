import { permutaToListing, validatePermutas } from './PermutaCatalog'

const apartment = { id: 'palco', tipo: 'apartamento', cidade: 'Goiânia', bairro: 'Jardim América', condominio: 'Edifício Palco Vaca Brava', quartos: 3, area: 98, valor: 930000, valorCondominio: 960 }
const land = { id: 'lote-talisma', tipo: 'terreno', cidade: 'Guapó', bairro: 'Loteamento Talismã', condominio: null, quartos: 0, area: 2544.9, valor: 280000, valorCondominio: null }

describe('permutas da Bambuí', () => {
    it('aceita o arquivo e transforma em anúncio de "Usados" com o selo, só com o bairro (sem endereço exato)', () => {
        const { file, errors } = validatePermutas({ referencia: '2026-10', imoveis: [apartment, land] })

        expect(errors).toEqual([])

        const listing = permutaToListing(file!.imoveis[0]).props

        expect(listing).toMatchObject({ slug: 'permuta-palco', category: 'used', type: 'apartamento', status: 'published', price: 930000, neighborhood: 'Jardim América', address: 'Edifício Palco Vaca Brava', developer: null, features: ['Permuta Bambuí'] })
        expect(listing.title).toBe('Apartamento de 3 quartos em Jardim América')
        expect(listing.description).toContain('98 m² privativos, no Edifício Palco Vaca Brava')
        expect(listing.description).toContain('R$ 960 por mês')
        expect(listing.description).not.toMatch(/ocupad|comiss|\(62\)/i)
    })

    it('terreno: título pela metragem e sem quartos no texto', () => {
        const listing = permutaToListing(land as never).props

        expect(listing.title).toBe('Terreno de 2.544,9 m² em Loteamento Talismã')
        expect(listing.description).toContain('Terreno de 2.544,9 m² em Loteamento Talismã, Guapó.')
        expect(listing.description).not.toMatch(/quarto/)
    })

    it('aponta cada erro com o imóvel e o campo, em português', () => {
        const { file, errors } = validatePermutas({ referencia: '10/2026', imoveis: [{ ...apartment, tipo: 'sitio', valor: '930' }, { ...apartment, quartos: 2.5, extra: 1 }, 'x'] })

        expect(file).toBeNull()
        expect(errors).toEqual(expect.arrayContaining([
            expect.stringMatching(/^referencia: use AAAA-MM/), expect.stringMatching(/^palco\.tipo: use apartamento/), expect.stringMatching(/^palco\.valor: use um número em reais/),
            expect.stringMatching(/^palco\.quartos: use um número inteiro/), expect.stringMatching(/^palco\.extra: campo desconhecido/), expect.stringMatching(/^palco\.id: repetido/), expect.stringMatching(/^imoveis\[2\]: precisa ser um objeto/)
        ]))
        expect(validatePermutas(null).errors).toHaveLength(1)
        expect(validatePermutas({ referencia: '2026-10', imoveis: 'x' }).errors).toContain('imoveis: use uma lista')
    })
})

describe('casa de permuta e detalhes da ficha', () => {
    it('casa mostra construção e terreno; vagas, suítes e destaques entram no anúncio', () => {
        const listing = permutaToListing({ ...apartment, id: 'madri', tipo: 'casa', condominio: null, quartos: 4, suites: 1, vagas: 4, area: 337.54, areaTerreno: 376.48, destaques: ['Área gourmet e piscina'] } as never).props

        expect(listing.title).toBe('Casa de 4 quartos em Jardim América')
        expect(listing.description).toContain('Casa de 4 quartos, com 337,54 m² construídos em terreno de 376,48 m²')
        expect(listing).toMatchObject({ suites: 1, parking: 4, features: ['Permuta Bambuí', 'Área gourmet e piscina'] })
    })

    it('rejeita suítes/vagas inválidas e destaque vazio', () => {
        const { errors } = validatePermutas({ referencia: '2026-10', imoveis: [{ ...apartment, suites: -1, vagas: 2.5, destaques: [''] }] })

        expect(errors).toEqual(expect.arrayContaining([expect.stringMatching(/^palco\.suites/), expect.stringMatching(/^palco\.vagas/), expect.stringMatching(/^palco\.destaques/)]))
    })
})

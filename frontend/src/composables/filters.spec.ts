import { describe, expect, it } from 'vitest'

import { activeFilterCount, filtersFromQuery, filtersToQuery } from './filters'

describe('filtros na URL', () => {
    it('lê números e textos e ignora valores inválidos', () => {
        expect(filtersFromQuery({ quartos: '3', min: '300000', cidade: 'Goiânia', vagas: 'abc', ordem: 'price_asc', tipo: '' })).toEqual({
            type: undefined, city: 'Goiânia', neighborhood: undefined, minPrice: 300000, maxPrice: undefined, bedrooms: 3, parking: undefined, q: undefined, sort: 'price_asc'
        })
        expect(filtersFromQuery({ ordem: 'hack', min: '-5' })).toMatchObject({ sort: undefined, minPrice: undefined })
    })

    it('ordem padrão (recentes) não vai para a URL; só o que foi preenchido', () => {
        expect(filtersToQuery({ bedrooms: 2, sort: 'recent', city: 'Goiânia' })).toEqual({ cidade: 'Goiânia', quartos: '2' })
        expect(filtersToQuery({ sort: 'price_desc', q: 'marista' })).toEqual({ busca: 'marista', ordem: 'price_desc' })
    })

    it('vai e volta sem perder nada', () => {
        const filters = { type: 'casa', city: 'Goiânia', neighborhood: 'Setor Bueno', minPrice: 200000, maxPrice: 900000, bedrooms: 3, parking: 2, q: 'jardim', sort: 'area_desc' as const }
        expect(filtersFromQuery(filtersToQuery(filters))).toEqual(filters)
    })

    it('conta só filtros (busca e ordem não entram no selo)', () => {
        expect(activeFilterCount({ bedrooms: 2, city: 'Goiânia', q: 'x', sort: 'price_asc' })).toBe(2)
        expect(activeFilterCount({})).toBe(0)
    })
})

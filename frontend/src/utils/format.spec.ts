import { describe, expect, it } from 'vitest'

import { count, formatArea, formatDelivery, formatPrice, formatPriceShort, summary } from './format'

describe('formatação', () => {
    it('preço em reais, ou "Sob consulta" sem valor', () => {
        expect(formatPrice(685000).replace(/\s/g, ' ')).toBe('R$ 685.000')
        expect(formatPrice(null)).toBe('Sob consulta')
    })

    it('preço curto para filtros', () => {
        expect(formatPriceShort(250_000)).toBe('R$ 250 mil')
        expect(formatPriceShort(1_500_000)).toBe('R$ 1,5 mi')
    })

    it('previsão de entrega em mês/ano', () => {
        expect(formatDelivery('2027-08')).toBe('ago/2027')
        expect(formatDelivery(null)).toBeNull()
        expect(formatDelivery('lixo')).toBeNull()
    })

    it('área, singular/plural e resumo do cartão', () => {
        expect(formatArea(98)).toBe('98 m²')
        expect(formatArea(null)).toBeNull()
        expect(count(1, 'quarto')).toBe('1 quarto')
        expect(count(3, 'vaga')).toBe('3 vagas')
        expect(summary({ bedrooms: 3, parking: 1, area: 98, type: 'apartamento' })).toBe('3 quartos · 1 vaga · 98 m²')
        expect(summary({ bedrooms: 0, parking: 0, area: null, type: 'terreno' })).toBe('')
    })
})

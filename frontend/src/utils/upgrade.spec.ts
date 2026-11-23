import { describe, expect, it } from 'vitest'

import { buildUpgradeMessage, EMPTY_UPGRADE, parseArea, parseCount, parseMoney, validateUpgrade, type UpgradeForm } from './upgrade'

const full: UpgradeForm = {
    type: 'Apartamento', neighborhood: 'Setor Bueno', city: 'Goiânia', building: 'Ed. Exemplo', area: '98', bedrooms: '3', suites: '1', parking: '2',
    status: 'financiado', statusDetail: 'saldo de uns R$ 120 mil', price: '650.000', interest: 'Praça 232', notes: 'Pode visitar à tarde.', name: 'Maria'
}

describe('upgrade: imóvel como parte do pagamento', () => {
    it('monta a mensagem do WhatsApp com tudo que foi preenchido', () => {
        const message = buildUpgradeMessage(full).replace(/ /g, ' ')

        expect(message).toContain('Olá! Quero avaliar o meu imóvel para um upgrade (análise inicial).')
        expect(message).toContain('*Imóvel*')
        expect(message).toContain('Tipo: Apartamento')
        expect(message).toContain('Localização: Setor Bueno, Goiânia (Ed. Exemplo)')
        expect(message).toContain('Área privativa: 98 m²')
        expect(message).toContain('Quartos: 3 · Suítes: 1 · Vagas: 2')
        expect(message).toContain('Situação: Financiado (saldo de uns R$ 120 mil)')
        expect(message).toContain('Valor pretendido: R$ 650.000')
        expect(message).toContain('Tenho interesse em: Praça 232')
        expect(message).toContain('Observações: Pode visitar à tarde.')
        expect(message.trim().endsWith('Nome: Maria')).toBe(true)
    })

    it('omite o que não foi preenchido (nada de "Quartos: 0" inventado)', () => {
        const message = buildUpgradeMessage({ ...EMPTY_UPGRADE, neighborhood: 'Marista', name: 'João' })

        expect(message).toContain('Localização: Marista, Goiânia')
        expect(message).not.toMatch(/Quartos|Suítes|Vagas|Área|Situação|Valor|interesse|Observações/)
        expect(message).not.toMatch(/\n{3,}/)
    })

    it('exige tipo, bairro e nome; área precisa ser número', () => {
        expect(validateUpgrade(EMPTY_UPGRADE)).toEqual({ neighborhood: 'Informe o bairro.', name: 'Informe seu nome.' })
        expect(validateUpgrade({ ...full, area: 'abc' })).toEqual({ area: 'Use só números (ex.: 98).' })
        expect(validateUpgrade(full)).toEqual({})
    })

    it('lê valores digitados de jeitos diferentes', () => {
        expect(parseMoney('R$ 650.000,00'.split(',')[0])).toBe(650000)
        expect(parseMoney('')).toBeNull()
        expect(parseArea('98,5')).toBe(98.5)
        expect(parseArea('0')).toBeNull()
        expect(parseCount('0')).toBe(0)
        expect(parseCount('')).toBeNull()
        expect(parseCount('2.5')).toBeNull()
    })

    it('limita textos longos e tira quebras de linha (a mensagem vai numa URL)', () => {
        const message = buildUpgradeMessage({ ...full, notes: `linha 1\n\nlinha 2 ${'x'.repeat(1000)}` })

        expect(message).toContain('Observações: linha 1 linha 2')
        expect(message.length).toBeLessThan(1200)
    })
})

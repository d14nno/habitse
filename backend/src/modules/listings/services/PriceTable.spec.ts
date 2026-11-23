import { monthLabel, parsePriceTable } from './PriceTable'

// Trechos reais do texto extraído das tabelas de novembro/2026 (as colunas vêm coladas, como no PDF)
const WITH_SITUATION = [
    'PRAÇA 232', 'Tabela:', 'PRAÇA 232 - NOVEMBRO/26', 'UNIDADE', 'ÁREA', 'PRIVATIVA', 'GARAGEMDEPÓSITO', 'OUTRAS', 'ÁREAS', 'SITUAÇÃOVALOR TOTAL',
    'ENTREGA DAS', 'CHAVES (1x)', '25/03/2028',
    '502', '157,39 m²', '20, 26 e', '26A', '- -- -', 'Disponível', 'R$1.912.400,00', 'R$', '95.620,00',
    '1101', '151,39 m²120, 120A e', '128', '36', 'Disponível', 'R$1.784.700,00', 'R$', '95.065,00',
    '1201', '151,39 m²121, 121A e', '127', '- -- -', 'Vendido', 'R$1.600.000,00', 'R$', '92.895,00',
    '- R-3-379.445 no Cartório de Registro de Imóveis da 1ª Circunscrição de Goiânia-GO.',
    'Gerado dia 03/11/2026 por alguém'
].join('\n')

const WITHOUT_SITUATION = [
    'AREIÃO 1141', 'AREIÃO 1141 - NOVEMBRO/26', 'UNIDADE', 'GARAGEMDEPÓSITOVALOR TOTALDESCONTOTOTAL - DESCONTO',
    '601', '81,1 m²10640', 'R$1.143.300,00R$40.930,14R$1.102.369,86', 'R$ 716.500,00',
    '502', '117,75 m²96 e 9744', 'R$1.659.900,00R$59.424,42R$1.600.475,58'
].join('\n')

const WITH_COMPLEMENT = ['B.GREAT NOVA SUIÇA - NOVEMBRO/26 - FIXA', 'SITUAÇÃO', '402 -', 'Connect', '74,24 m²2051213,812 m²- -', 'Disponível', 'R$679.545,42R$33.977,27', '404 -', 'Connect', '84,76 m²116 e 116A692,953 m²- -', 'Disponível', 'R$890.933,35R$44.546,67'].join('\n')

describe('leitura da tabela de preços', () => {
    it('lê unidade, área e valor total; "a partir de" é o menor valor entre as disponíveis', () => {
        const table = parsePriceTable(WITH_SITUATION)

        expect(table.units.map(unit => [unit.unit, unit.area, unit.total, unit.available])).toEqual([
            ['502', 157.39, 1912400, true], ['1101', 151.39, 1784700, true], ['1201', 151.39, 1600000, false]
        ])
        expect(table.priceFrom).toBe(1784700)
        expect(table.availableCount).toBe(2)
        expect(table.month).toBe('2026-11')
        expect(table.keysDate).toBe('2028-03')
        expect(table.registry).toBe('R-3-379.445 no Cartório de Registro de Imóveis da 1ª Circunscrição de Goiânia-GO')
    })

    it('tabela sem coluna de situação considera todas as unidades listadas; sem entrega nem registro, vêm nulos', () => {
        const table = parsePriceTable(WITHOUT_SITUATION)

        expect(table.availableCount).toBe(2)
        expect(table.priceFrom).toBe(1143300)
        expect(table.keysDate).toBeNull()
        expect(table.registry).toBeNull()
    })

    it('unidade com complemento na linha de baixo ("402 - Connect") também é lida', () => {
        expect(parsePriceTable(WITH_COMPLEMENT).units.map(unit => [unit.unit, unit.total])).toEqual([['402', 679545.42], ['404', 890933.35]])
    })

    it('texto que não é tabela não gera unidades nem preço', () => {
        expect(parsePriceTable('qualquer coisa')).toMatchObject({ units: [], priceFrom: null, availableCount: 0, month: null })
    })

    it('nome do mês por extenso', () => {
        expect(monthLabel('2026-11')).toBe('novembro de 2026')
        expect(monthLabel('2027-03')).toBe('março de 2027')
    })
})

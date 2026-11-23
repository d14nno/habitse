/**
 * Leitura das tabelas de preço mensais da Bambuí (PDF gerado pelo sistema de vendas).
 *
 * Só o texto do PDF entra aqui (a extração fica no comando), para a regra ser testável sem arquivo. Cada linha da tabela
 * começa pela unidade e pela área privativa; o primeiro valor em reais depois disso é o "VALOR TOTAL" da unidade.
 */

export interface PriceTableUnit {
    unit: string
    /** m² privativos */
    area: number
    available: boolean
    /** Valor total da unidade (tabela cheia, sem desconto), em reais */
    total: number
}

export interface PriceTable {
    /** AAAA-MM da tabela (ex.: "2026-11") */
    month: string | null
    units: PriceTableUnit[]
    /** Menor valor entre as unidades disponíveis ("a partir de") */
    priceFrom: number | null
    availableCount: number
    /** AAAA-MM da entrega das chaves, quando a tabela traz essa coluna */
    keysDate: string | null
    /** Linha do registro de incorporação citada no rodapé (ex.: "R-3-379.445 no Cartório de Registro de Imóveis…") */
    registry: string | null
}

const MONTHS = ['JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO']
const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const reais = (text: string) => Number(text.replace(/\./g, '').replace(',', '.'))

const ROW = /(?:^|\n)(\d{2,4})(?: -\n[^\n]+)?\n(\d+(?:,\d+)?) m²([\s\S]*?)(?=\n\d{2,4}(?: -\n[^\n]+)?\n\d+(?:,\d+)? m²|$)/g

export function parsePriceTable(text: string): PriceTable {
    const hasSituation = /SITUA[ÇC][ÃA]O/.test(text)
    const units: PriceTableUnit[] = []

    const rows = new RegExp(ROW.source, 'g')
    let match: RegExpExecArray | null

    while ((match = rows.exec(text))) {
        const [, unit, area, body] = match
        const total = body.match(/R\$\s*([\d.]+,\d{2})/)

        if (!total) continue

        units.push({ unit, area: reais(area), total: reais(total[1]), available: hasSituation ? /Dispon[ií]vel/i.test(body) : true })
    }

    const available = units.filter(unit => unit.available)

    const monthMatch = text
        .toUpperCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .match(new RegExp(`(${MONTHS.join('|')})\\s*/\\s*(\\d{2})\\b`))
    const month = monthMatch ? `20${monthMatch[2]}-${String(MONTHS.indexOf(monthMatch[1]) + 1).padStart(2, '0')}` : null

    const keys = text.match(/ENTREGA DAS\s*CHAVES\s*\(1x\)\s*(\d{2})\/(\d{2})\/(\d{4})/i)
    const registry = text.match(/^[\s-]*(R-\d+-[\d.]+[^\n]*)$/m)

    return {
        month,
        units,
        priceFrom: available.length ? Math.min(...available.map(unit => unit.total)) : null,
        availableCount: available.length,
        keysDate: keys ? `${keys[3]}-${keys[2]}` : null,
        registry: registry ? registry[1].trim().replace(/\.$/, '').replace(/\s+/g, ' ') : null
    }
}

/** "2026-11" → "novembro de 2026" */
export function monthLabel(month: string): string {
    const [year, number] = month.split('-')

    return `${MONTH_NAMES[Number(number) - 1]} de ${year}`
}

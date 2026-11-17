const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

/** R$ 685.000 — ou "Sob consulta" quando o anúncio não tem valor */
export const formatPrice = (price: number | null | undefined) => (price === null || price === undefined ? 'Sob consulta' : brl.format(price))

/** R$ 685 mil / R$ 1,2 mi: para faixas e chips onde o espaço é curto */
export function formatPriceShort(price: number): string {
    if (price >= 1_000_000) return `R$ ${(price / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
    if (price >= 1_000) return `R$ ${Math.round(price / 1_000).toLocaleString('pt-BR')} mil`
    return `R$ ${price}`
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** 2027-08 → "ago/2027" */
export function formatDelivery(value: string | null | undefined): string | null {
    const match = value?.match(/^(\d{4})-(\d{2})$/)
    return match ? `${MONTHS[Number(match[2]) - 1]}/${match[1]}` : null
}

export const formatArea = (area: number | null | undefined) => (area ? `${area.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m²` : null)

/** "3 quartos", "1 vaga"... (singular/plural) */
export const count = (value: number, singular: string, plural = `${singular}s`) => `${value} ${value === 1 ? singular : plural}`

/** Linha curta de características para o cartão: "3 quartos · 2 vagas · 98 m²" */
export function summary(item: { bedrooms: number, parking: number, area: number | null, type: string }): string {
    const parts: string[] = []
    if (item.bedrooms) parts.push(count(item.bedrooms, 'quarto'))
    if (item.parking) parts.push(count(item.parking, 'vaga'))
    const area = formatArea(item.area)
    if (area) parts.push(area)
    return parts.join(' · ')
}

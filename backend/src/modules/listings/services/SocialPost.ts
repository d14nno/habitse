import { CatalogItem } from './StaticCatalog'

/**
 * Posts para Instagram e Facebook a partir do catálogo do site: o mesmo texto e as mesmas fotos servem aos dois.
 * Aqui ficam só as regras (legenda, fotos, preço); o desenho das imagens está em `shared/infra/cli/makePosts.ts`.
 * Os dados de contato repetem `frontend/src/config.ts`.
 */
export const CONTACT = {
    site: 'https://habitse.com.br',
    phone: '(62) 99832-2361',
    consultant: 'Adriano Oliveira de Freitas',
    creci: '49.743/GO'
}

export const DISCLAIMER = 'Imagens ilustrativas. Valores e disponibilidade sujeitos a confirmação.'

/** Quantas fotos entram no carrossel (a primeira é a capa com os dados; depois vem o fechamento) */
export const PHOTO_SLIDES = 5

const STATUS: Record<string, string> = {
    ready: 'Pronto para morar',
    off_plan: 'Lançamento',
    under_construction: 'Em construção',
    used: 'Oportunidade de mercado'
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const statusLabel = (category: string) => STATUS[category] ?? 'Imóvel'

export function formatMoney(value: number): string {
    return `R$ ${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
}

/** "a partir de" só para empreendimentos (tabela do mês); usado é valor direto */
export function priceLine(item: Pick<CatalogItem, 'category' | 'price'>): string | null {
    if (item.price === null || item.price === undefined || item.price <= 0) return null

    return item.category === 'used' ? formatMoney(item.price) : `a partir de ${formatMoney(item.price)}`
}

/** "84 m² · 2 suítes · 2 vagas" (o que não tem não aparece) */
export function facts(item: Pick<CatalogItem, 'area' | 'suites' | 'bedrooms' | 'parking'>): string {
    const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

    return [
        item.area > 0 ? `${String(item.area).replace('.', ',')} m²` : '',
        item.suites > 0 ? plural(item.suites, 'suíte', 'suítes') : item.bedrooms > 0 ? plural(item.bedrooms, 'quarto', 'quartos') : '',
        item.parking > 0 ? plural(item.parking, 'vaga', 'vagas') : ''
    ].filter(Boolean).join(' · ')
}

/** "ago/2027" a partir de "2027-08" */
export function deliveryText(date: string | null): string | null {
    const match = date?.match(/^(\d{4})-(\d{2})/)

    return match ? `${MONTHS[Number(match[2]) - 1]}/${match[1]}` : null
}

const hashtag = (text: string) => `#${text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`

export function hashtags(item: Pick<CatalogItem, 'category' | 'neighborhood' | 'city'>): string {
    const byCategory: Record<string, string[]> = {
        ready: ['#prontoparamorar'],
        off_plan: ['#lancamento', '#naplanta'],
        under_construction: ['#emconstrucao'],
        used: ['#oportunidade']
    }

    return Array.from(new Set([
        hashtag(item.neighborhood), hashtag(item.city), ...(byCategory[item.category] ?? []),
        '#imoveis', '#imoveisdealtopadrao', '#habitse'
    ])).filter(tag => tag.length > 1).join(' ')
}

/** Legenda pronta, igual para Instagram e Facebook (no Instagram, o link vai na bio) */
export function buildCaption(item: CatalogItem, site = CONTACT.site): string {
    const price = priceLine(item)
    const delivery = item.category === 'used' ? null : deliveryText(item.deliveryDate)

    return [
        item.title,
        `${statusLabel(item.category)} · ${item.neighborhood}, ${item.city}`,
        [facts(item), price, delivery ? `Entrega ${delivery}` : ''].filter(Boolean).join('\n'),
        `Fale com ${CONTACT.consultant} pelo WhatsApp ${CONTACT.phone}.\nVeja o imóvel completo: ${site}/imovel/${item.slug} (no Instagram, link na bio).`,
        `CRECI ${CONTACT.creci}\n${DISCLAIMER}`,
        hashtags(item)
    ].filter(block => block.trim()).join('\n\n')
}

/** Fotos do carrossel: as primeiras do catálogo (fachada e lazer vêm antes), sem repetir */
export function pickSlidePhotos(item: Pick<CatalogItem, 'photos'>, limit = PHOTO_SLIDES): string[] {
    return Array.from(new Set(item.photos)).slice(0, limit)
}

import { Listing } from '../entities/Listing'
import { ListingCategory } from '../enums/ListingCategory'
import { ListingRepository } from '../repositories/ListingRepository'
import { BambuiProject, BambuiRange, BambuiStatus, discoverProjectUrls, parseBambuiPage, sentenceCase, titleCase } from './BambuiParser'

export const BAMBUI_DEVELOPER = 'Bambuí'
export const BAMBUI_BASE_URL = 'https://bambui.com.br'
const MAX_PHOTOS = 12

/** Quantas fotos de cada grupo da galeria entram na vitrine (plantas e fotos de obra ficam de fora) */
const PHOTO_PLAN: [string, number][] = [['Fachada', 3], ['Apartamento', 3], ['Lazer', 4], ['Serviços', 2]]

/** Itens de lazer reconhecidos pelo nome do arquivo da foto (a página não traz a lista em texto) */
const FEATURE_BY_FILE: [RegExp, string][] = [
    [/piscina/i, 'Piscina'], [/sauna/i, 'Sauna'], [/sal[aã]o[-_ ]?de[-_ ]?festas/i, 'Salão de festas'], [/academia|fitness/i, 'Academia'],
    [/brinquedoteca/i, 'Brinquedoteca'], [/rooftop/i, 'Rooftop'], [/playground/i, 'Playground'], [/sport[-_ ]?bar/i, 'Sport bar'], [/spot[-_ ]?bar/i, 'Spot bar'],
    [/market/i, 'Market'], [/storage/i, 'Storage'], [/coworking/i, 'Coworking'], [/churrasqueira|gourmet/i, 'Espaço gourmet'], [/pet/i, 'Pet place']
]

const CATEGORY_BY_STATUS: Record<BambuiStatus, ListingCategory> = {
    upcoming: ListingCategory.OFF_PLAN,
    under_construction: ListingCategory.UNDER_CONSTRUCTION,
    // Não existe vitrine para "novo pronto para morar": entra na de prontos (usados), mas como rascunho até alguém decidir
    ready: ListingCategory.USED
}

export interface ImportOptions {
    /** Publica também os empreendimentos já prontos (por padrão ficam como rascunho) */
    publishReady?: boolean
}

export type ImportOutcome =
    | { slug: string, name: string, action: 'created' | 'updated', status: string, missing: string[] }
    | { slug: string, action: 'skipped', reason: string }

const rangeText = (range: BambuiRange | null, unit = '') => {
    if (!range) return ''
    // "3", "2 e 3" (dois valores seguidos) ou "118 a 252"
    const text = range.min === range.max ? String(range.min) : `${range.min} ${range.max - range.min === 1 ? 'e' : 'a'} ${range.max}`

    return `${text}${unit}`
}

const plural = (range: BambuiRange | null, one: string, many: string) => (range ? `${rangeText(range)} ${range.max === 1 ? one : many}` : '')

/** Endereço sem o CEP e sem caixa alta, como aparece no anúncio ("Rua 1141, Quadra 253, Lote 38/40, Setor Marista") */
export function tidyAddress(address: string | null): string | null {
    if (!address) return null

    const cleaned = address
        .replace(/\s*[-,]?\s*CEP:?\s*\d{5}-\d{3}/i, '')
        .replace(/[,\s-]*\d{5}-\d{3}\s*$/, '')
        .replace(/\s*[-,]?\s*Goi[âa]nia\s*-?\s*GO\s*$/i, '')
        .replace(/(^|[\s,-])St\.?\s+(?=[A-ZÀ-Ý])/g, '$1Setor ')
        .trim()

    return (cleaned === cleaned.toUpperCase() ? titleCase(cleaned) : cleaned).slice(0, 200)
}

function pickPhotos(project: BambuiProject): string[] {
    const chosen: string[] = []
    const leftovers: string[] = []

    for (const [group, count] of PHOTO_PLAN) {
        const urls = project.gallery[group] ?? []
        chosen.push(...urls.slice(0, count))
        leftovers.push(...urls.slice(count))
    }

    return Array.from(new Set([...chosen, ...leftovers])).slice(0, MAX_PHOTOS)
}

function pickFeatures(project: BambuiProject): string[] {
    const files = [...(project.gallery.Lazer ?? []), ...(project.gallery['Serviços'] ?? [])].map(url => decodeURIComponent(url.split('/').pop() ?? ''))

    return FEATURE_BY_FILE.filter(([pattern]) => files.some(file => pattern.test(file))).map(([, label]) => label)
}

function describe(project: BambuiProject): string {
    // Nomes próprios que voltam com maiúscula (o nome do empreendimento, o bairro e a última palavra dele: "Marista")
    const keep = [project.name, project.neighborhood ?? '', (project.neighborhood ?? '').split(' ').pop() ?? '']
    const blocks: string[] = []

    if (project.tagline) blocks.push(sentenceCase(project.tagline, keep).replace(/[.]*$/, '.'))
    if (project.description) blocks.push(sentenceCase(project.description, keep))

    const facts = [
        project.area ? `Metragens: ${rangeText(project.area)} m²` : '',
        project.bedrooms ? `Quartos: ${rangeText(project.bedrooms)}` : '',
        project.suites ? `Suítes: ${rangeText(project.suites)}` : '',
        project.parking ? `Vagas: ${rangeText(project.parking)}` : ''
    ].filter(Boolean)
    if (facts.length) blocks.push(`${facts.join(' · ')}.`)

    // Andamento só conta enquanto a obra está em curso (o site mostra a barra mesmo nos prontos)
    if (project.status === 'under_construction' && project.progress !== null) blocks.push(`Obra ${String(project.progress).replace('.', ',')}% concluída${project.progressDate ? ` (atualizado em ${project.progressDate.toLowerCase()})` : ''}.`)

    return blocks.join('\n\n')
}

/** Converte o que a página informa em anúncio. Preço fica "sob consulta": a página da Bambuí não publica valores. */
export function toListing(project: BambuiProject, options: ImportOptions = {}): { listing: Listing, missing: string[] } {
    const category = CATEGORY_BY_STATUS[project.status ?? 'upcoming']
    const typology = project.suites ? plural(project.suites, 'suíte', 'suítes') : plural(project.bedrooms, 'quarto', 'quartos')
    const missing: string[] = ['preço', 'registro de incorporação', 'previsão de entrega']
    if (!project.neighborhood) missing.push('bairro')
    if (!project.parking) missing.push('vagas')
    if (!project.gallery.Fachada?.length && !project.gallery.Apartamento?.length) missing.push('fotos')

    const listing = Listing.create({
        slug: project.slug,
        title: typology ? `${project.name} — ${typology}` : project.name,
        category,
        type: 'apartamento',
        status: project.status === 'ready' && !options.publishReady ? 'draft' : 'published',
        price: null,
        city: project.city ?? 'Goiânia',
        state: project.state ?? 'GO',
        neighborhood: project.neighborhood ?? '',
        address: tidyAddress(project.address),
        // Quarto é no mínimo o número de suítes (toda suíte é um quarto)
        bedrooms: project.bedrooms?.min ?? project.suites?.min ?? 0,
        suites: project.suites?.min ?? 0,
        bathrooms: 0,
        parking: project.parking?.min ?? 0,
        area: project.area?.min ?? null,
        description: describe(project),
        features: pickFeatures(project),
        photos: pickPhotos(project),
        developer: BAMBUI_DEVELOPER,
        deliveryDate: null,
        constructionProgress: project.progress === null ? null : Math.round(project.progress),
        featured: false
    })

    return { listing, missing }
}

export type Fetcher = (url: string) => Promise<string>

/**
 * Importa os empreendimentos do site da Bambuí para a vitrine. Pode rodar de novo: atualiza o conteúdo de cada
 * empreendimento (textos, fotos, endereço, andamento da obra) e preserva o que foi ajustado no Habitse
 * (preço, destaque e situação de publicação).
 */
export class BambuiImportService {
    constructor(private readonly listings: Pick<ListingRepository, 'upsertBySlug'>, private readonly fetchPage: Fetcher, private readonly delayMs = 1000) { }

    async run(options: ImportOptions & { only?: string[], dryRun?: boolean } = {}): Promise<ImportOutcome[]> {
        const index = await this.fetchPage(`${BAMBUI_BASE_URL}/lancamentos`)
        const urls = discoverProjectUrls(index, BAMBUI_BASE_URL).filter(url => !options.only?.length || options.only.some(slug => url.includes(`/${slug}/`)))
        const outcomes: ImportOutcome[] = []

        for (let position = 0; position < urls.length; position++) {
            const url = urls[position]
            if (position > 0 && this.delayMs > 0) await new Promise(resolve => setTimeout(resolve, this.delayMs))

            const slug = url.replace(/\/+$/, '').split('/').pop() as string

            try {
                const project = parseBambuiPage(await this.fetchPage(url), url)

                if (!project) {
                    outcomes.push({ slug, action: 'skipped', reason: 'a página não parece um empreendimento (sem nome ou situação)' })
                    continue
                }

                const { listing, missing } = toListing(project, options)

                if (options.dryRun) {
                    outcomes.push({ slug, name: project.name, action: 'created', status: listing.props.status, missing })
                    continue
                }

                const saved = await this.listings.upsertBySlug(listing)
                outcomes.push({ slug, name: project.name, action: saved.created ? 'created' : 'updated', status: saved.listing.props.status, missing })
            } catch (error) {
                outcomes.push({ slug, action: 'skipped', reason: error instanceof Error ? error.message : String(error) })
            }
        }

        return outcomes
    }
}

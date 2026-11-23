import { Listing, ListingProps } from '../entities/Listing'
import { CATEGORY_INFO, LISTING_CATEGORIES, LISTING_STATUSES, ListingStatus } from '../enums/ListingCategory'
import { ListingMapper } from '../mappers/ListingMapper'
import { isFresh, TableInfos } from './PriceTableSync'

/**
 * Catálogo estático: o site pode publicar os empreendimentos sem depender da API/banco do servidor. A importação
 * gera `empreendimentos.json` (e o sitemap) dentro do próprio site, e o Cloudflare Pages publica a cada `git push`.
 *
 * Preço, registro de incorporação, previsão de entrega e outros ajustes que o site da Bambuí não traz ficam num arquivo
 * à parte (`data/bambui-ajustes.json`), editável à mão, que a importação nunca sobrescreve.
 */

/** Campos que podem ser ajustados à mão por empreendimento (a chave é o endereço do anúncio, ex.: "praca-232") */
export interface Adjustment {
    price?: number | null
    /** AAAA-MM */
    deliveryDate?: string | null
    /** Ex.: "R-3 da matrícula 12.345 do 1º CRI de Goiânia · Incorporador: Bambuí Empreendimentos Ltda" */
    incorporation?: string | null
    featured?: boolean
    status?: ListingStatus
    title?: string
    description?: string
    address?: string | null
    bedrooms?: number
    suites?: number
    bathrooms?: number
    parking?: number
    area?: number | null
    category?: ListingProps['category']
    photos?: string[]
    /** Fotos da abertura do site: uma fachada e uma de lazer */
    hero?: string[]
    /** Observação sob o preço (ex.: "Tabela de novembro de 2026 · 40 unidades disponíveis") */
    priceNote?: string | null
}

export type Adjustments = Record<string, Adjustment>

export type CatalogItem = ReturnType<typeof ListingMapper.toDetail> & { incorporation: string | null, priceNote: string | null, hero: string[], permuta: boolean }

export interface Catalog {
    version: 1
    items: CatalogItem[]
}

const COUNTS = ['bedrooms', 'suites', 'bathrooms', 'parking'] as const
const KNOWN = ['price', 'deliveryDate', 'incorporation', 'priceNote', 'featured', 'status', 'title', 'description', 'address', 'area', 'category', 'photos', 'hero', ...COUNTS]

/** Confere o arquivo de ajustes (editado à mão): devolve os erros em português, um por problema */
export function validateAdjustments(raw: unknown): { adjustments: Adjustments, errors: string[] } {
    const errors: string[] = []

    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return { adjustments: {}, errors: ['o arquivo de ajustes precisa ser um objeto: { "slug-do-empreendimento": { ... } }'] }

    for (const [slug, value] of Object.entries(raw as Record<string, unknown>)) {
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
            errors.push(`${slug}: precisa ser um objeto com os campos a ajustar`)
            continue
        }

        const adjustment = value as Record<string, unknown>
        const fail = (field: string, expected: string) => errors.push(`${slug}.${field}: ${expected}`)

        for (const key of Object.keys(adjustment)) if (!KNOWN.includes(key)) fail(key, `campo desconhecido (use: ${KNOWN.join(', ')})`)

        const { price, deliveryDate, incorporation, priceNote, hero, featured, status, title, description, address, area, category, photos } = adjustment

        if (price !== undefined && price !== null && !(typeof price === 'number' && Number.isFinite(price) && price >= 0)) fail('price', 'use um número em reais (ex.: 1450000) ou null')
        if (deliveryDate !== undefined && deliveryDate !== null && !(typeof deliveryDate === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(deliveryDate))) fail('deliveryDate', 'use AAAA-MM (ex.: "2028-12") ou null')
        if (incorporation !== undefined && incorporation !== null && !(typeof incorporation === 'string' && incorporation.length <= 300)) fail('incorporation', 'use um texto de até 300 caracteres ou null')
        if (hero !== undefined && !(Array.isArray(hero) && hero.every(url => typeof url === 'string' && /^https?:\/\/|^\//.test(url)))) fail('hero', 'use uma lista de endereços de imagem (https://… ou /caminho)')
        if (priceNote !== undefined && priceNote !== null && !(typeof priceNote === 'string' && priceNote.length <= 160)) fail('priceNote', 'use um texto de até 160 caracteres ou null')
        if (featured !== undefined && typeof featured !== 'boolean') fail('featured', 'use true ou false')
        if (status !== undefined && !LISTING_STATUSES.includes(status as ListingStatus)) fail('status', `use ${LISTING_STATUSES.join(', ')}`)
        if (title !== undefined && !(typeof title === 'string' && title.trim() !== '' && title.length <= 160)) fail('title', 'use um texto de até 160 caracteres')
        if (description !== undefined && typeof description !== 'string') fail('description', 'use um texto')
        if (address !== undefined && address !== null && !(typeof address === 'string' && address.length <= 200)) fail('address', 'use um texto de até 200 caracteres ou null')
        if (area !== undefined && area !== null && !(typeof area === 'number' && area > 0)) fail('area', 'use um número em m² ou null')
        if (category !== undefined && !LISTING_CATEGORIES.includes(category as never)) fail('category', `use ${LISTING_CATEGORIES.join(', ')}`)
        if (photos !== undefined && !(Array.isArray(photos) && photos.every(url => typeof url === 'string' && /^https?:\/\/|^\//.test(url)))) fail('photos', 'use uma lista de endereços de imagem (https://… ou /caminho)')

        for (const key of COUNTS) {
            const count = adjustment[key]
            if (count !== undefined && !(typeof count === 'number' && Number.isInteger(count) && count >= 0 && count <= 99)) fail(key, 'use um número inteiro de 0 a 99')
        }
    }

    return { adjustments: errors.length ? {} : (raw as Adjustments), errors }
}

const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/**
 * O mesmo bairro chega escrito de jeitos diferentes (site da Bambuí sem acento, lista de permutas com acento).
 * Fica a grafia com acento, para a lista de bairros e os filtros não duplicarem.
 */
export function canonicalPlaces(items: CatalogItem[]): CatalogItem[] {
    const best = new Map<string, string>()
    for (const value of items.flatMap(item => [item.neighborhood, item.city])) {
        const key = fold(value)
        const current = best.get(key)
        if (!current || (/[^ -~]/.test(value) && !/[^ -~]/.test(current))) best.set(key, value)
    }

    return items.map(item => ({ ...item, neighborhood: best.get(fold(item.neighborhood)) ?? item.neighborhood, city: best.get(fold(item.city)) ?? item.city }))
}

/** Aplica o ajuste manual sobre o anúncio importado (o que não foi ajustado fica como veio do site) */
export function applyAdjustment(listing: Listing, adjustment: Adjustment | undefined): { listing: Listing, incorporation: string | null, priceNote: string | null, hero: string[] } {
    const { incorporation = null, priceNote = null, hero = [], ...fields } = adjustment ?? {}
    const clean = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined))

    return { listing: Listing.create({ ...listing.props, ...clean } as ListingProps), incorporation, priceNote, hero }
}

/**
 * Monta o catálogo com os anúncios publicados (rascunho e vendido ficam de fora), em ordem estável por endereço.
 * `updatedAt` só muda quando o conteúdo do item muda: assim a rotina diária não gera commit à toa.
 */
export function buildCatalog(imported: Listing[], adjustments: Adjustments, previous: Catalog | null, now = new Date()): Catalog {
    const before = new Map((previous?.items ?? []).map(item => [item.slug, item]))
    const items: CatalogItem[] = []

    const sorted = [...imported].sort((a, b) => a.slug.localeCompare(b.slug))

    sorted.forEach((original, index) => {
        const { listing, incorporation, priceNote, hero } = applyAdjustment(original, adjustments[original.slug])
        if (!listing.isPublished) return

        const detail = ListingMapper.toDetail(new Listing({ ...listing.props, id: index + 1, updatedAt: now }))
        const item: CatalogItem = { ...detail, incorporation, priceNote, hero, permuta: original.slug.startsWith('permuta-') }

        const old = before.get(item.slug)
        const sameContent = old && JSON.stringify({ ...old, updatedAt: '', id: 0 }) === JSON.stringify({ ...item, updatedAt: '', id: 0 })
        items.push(sameContent ? { ...item, updatedAt: old.updatedAt } : item)
    })

    return { version: 1, items: canonicalPlaces(items) }
}

/** Preço e entrega vindos da tabela do mês; o que está em `data/bambui-ajustes.json` (à mão) sempre vale mais */
export function adjustmentsFromTables(tables: TableInfos, now = new Date()): Adjustments {
    return Object.fromEntries(Object.entries(tables).filter(([, info]) => isFresh(info, now)).map(([slug, info]) => [slug, {
        price: info.priceFrom,
        ...(info.keysDate ? { deliveryDate: info.keysDate } : {})
    }]))
}

/** Fotos copiadas do Drive para o site (`data/bambui-fotos.json`); entram abaixo dos ajustes feitos à mão */
export function adjustmentsFromPhotos(fotos: Record<string, { file: string, tag?: string }[]>): Adjustments {
    return Object.fromEntries(Object.entries(fotos).filter(([, photos]) => photos.length).map(([slug, photos]) => {
        // Abertura do site: a primeira fachada e a primeira foto de lazer
        const hero = [photos.find(photo => photo.tag === 'fachada'), photos.find(photo => photo.tag === 'lazer')].filter((photo): photo is { file: string, tag?: string } => photo !== undefined).map(photo => photo.file)

        return [slug, { photos: photos.map(photo => photo.file), ...(hero.length ? { hero } : {}) }]
    }))
}

export function mergeAdjustments(base: Adjustments, manual: Adjustments): Adjustments {
    const slugs = new Set([...Object.keys(base), ...Object.keys(manual)])

    return Object.fromEntries(Array.from(slugs, slug => [slug, { ...base[slug], ...Object.fromEntries(Object.entries(manual[slug] ?? {}).filter(([, value]) => value !== undefined)) }]))
}

export const catalogToJson = (catalog: Catalog) => `${JSON.stringify(catalog, null, 2)}\n`

/** Sitemap do site estático: início, categorias e cada empreendimento publicado */
export function buildSitemap(catalog: Catalog, siteUrl: string): string {
    const base = siteUrl.replace(/\/$/, '')
    const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    const entry = (path: string, lastmod?: string) => `  <url><loc>${escape(base + path)}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}</url>`

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        entry('/'),
        ...Object.values(CATEGORY_INFO).map(category => entry(`/${category.slug}`)),
        ...catalog.items.map(item => entry(`/imovel/${encodeURIComponent(item.slug)}`, item.updatedAt)),
        '</urlset>',
        ''
    ].join('\n')
}

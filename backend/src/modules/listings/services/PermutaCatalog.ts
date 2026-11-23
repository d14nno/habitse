import { Listing } from '../entities/Listing'
import { ListingCategory, ListingStatus, LISTING_STATUSES, LISTING_TYPES, ListingType } from '../enums/ListingCategory'

/**
 * Imóveis de permuta da Bambuí (lista mensal do time de revendas), publicados na vitrine "Usados" sem selo
 * nem menção na página. O arquivo `data/bambui-permutas.json` é editado à mão (ou revisto todo mês com a lista nova).
 * Ficam de fora, de propósito: endereço exato, unidade, ocupação, comissão e contato pessoal — o site mostra só
 * o bairro e o atendimento é feito pelo contato do próprio site.
 */
export interface Permuta {
    /** Identificador estável (vira o endereço do anúncio: permuta-<id>) */
    id: string
    tipo: ListingType
    cidade: string
    bairro: string
    condominio: string | null
    quartos: number
    suites?: number
    vagas?: number
    /** m² (privativos no apartamento, construídos na casa, totais no terreno) */
    area: number
    /** m² do terreno, quando a casa tem terreno maior que a construção */
    areaTerreno?: number
    /** Detalhes que viram "Diferenciais" no anúncio (andar, vista, condições…) */
    destaques?: string[]
    valor: number
    valorCondominio: number | null
    status?: ListingStatus
    /** Fotos (https://… ou /caminho) */
    fotos?: string[]
}

export interface PermutaFile {
    /** AAAA-MM da lista de origem */
    referencia: string
    imoveis: Permuta[]
}


const FIELDS = ['id', 'tipo', 'cidade', 'bairro', 'condominio', 'quartos', 'suites', 'vagas', 'area', 'areaTerreno', 'destaques', 'valor', 'valorCondominio', 'status', 'fotos']

export function validatePermutas(raw: unknown): { file: PermutaFile | null, errors: string[] } {
    const errors: string[] = []
    const object = raw as Record<string, unknown> | null

    if (object === null || typeof object !== 'object' || Array.isArray(object)) return { file: null, errors: ['o arquivo de permutas precisa ser um objeto: { "referencia": "AAAA-MM", "imoveis": [ ... ] }'] }
    if (typeof object.referencia !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(object.referencia)) errors.push('referencia: use AAAA-MM (ex.: "2026-10")')
    if (!Array.isArray(object.imoveis)) return { file: null, errors: [...errors, 'imoveis: use uma lista'] }

    const seen = new Set<string>()

    object.imoveis.forEach((entry, index) => {
        const item = entry as Record<string, unknown>
        const where = typeof item?.id === 'string' ? item.id : `imoveis[${index}]`
        const fail = (field: string, expected: string) => errors.push(`${where}.${field}: ${expected}`)

        if (item === null || typeof item !== 'object' || Array.isArray(item)) return void errors.push(`${where}: precisa ser um objeto`)

        for (const key of Object.keys(item)) if (!FIELDS.includes(key)) fail(key, `campo desconhecido (use: ${FIELDS.join(', ')})`)

        if (typeof item.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(item.id)) fail('id', 'use letras minúsculas, números e hífens (ex.: "gran-campinas")')
        else if (seen.has(item.id)) fail('id', 'repetido')
        else seen.add(item.id)

        if (!LISTING_TYPES.includes(item.tipo as ListingType)) fail('tipo', `use ${LISTING_TYPES.join(', ')}`)
        for (const field of ['cidade', 'bairro']) if (typeof item[field] !== 'string' || !(item[field] as string).trim()) fail(field, 'use um texto')
        if (item.condominio !== null && typeof item.condominio !== 'string') fail('condominio', 'use um texto ou null')
        if (!(typeof item.quartos === 'number' && Number.isInteger(item.quartos) && item.quartos >= 0 && item.quartos <= 99)) fail('quartos', 'use um número inteiro de 0 a 99')
        for (const field of ['suites', 'vagas']) if (item[field] !== undefined && !(typeof item[field] === 'number' && Number.isInteger(item[field]) && (item[field] as number) >= 0 && (item[field] as number) <= 99)) fail(field, 'use um número inteiro de 0 a 99')
        if (!(typeof item.area === 'number' && item.area > 0)) fail('area', 'use um número em m²')
        if (item.areaTerreno !== undefined && !(typeof item.areaTerreno === 'number' && item.areaTerreno > 0)) fail('areaTerreno', 'use um número em m²')
        if (item.destaques !== undefined && !(Array.isArray(item.destaques) && item.destaques.every(text => typeof text === 'string' && text.trim() !== '' && text.length <= 120))) fail('destaques', 'use uma lista de textos curtos (até 120 caracteres)')
        if (!(typeof item.valor === 'number' && item.valor > 0)) fail('valor', 'use um número em reais (ex.: 930000)')
        if (item.valorCondominio !== null && !(typeof item.valorCondominio === 'number' && item.valorCondominio >= 0)) fail('valorCondominio', 'use um número em reais ou null')
        if (item.status !== undefined && !LISTING_STATUSES.includes(item.status as ListingStatus)) fail('status', `use ${LISTING_STATUSES.join(', ')}`)
        if (item.fotos !== undefined && !(Array.isArray(item.fotos) && item.fotos.every(url => typeof url === 'string' && /^https?:\/\/|^\//.test(url)))) fail('fotos', 'use uma lista de endereços de imagem (https://… ou /caminho)')
    })

    return { file: errors.length ? null : (object as unknown as PermutaFile), errors }
}

const number = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const money = (value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

const TITLES: Record<string, (p: Permuta) => string> = {
    terreno: p => `Terreno de ${number(p.area)} m² em ${p.bairro}`,
    default: p => `${p.tipo === 'casa' ? 'Casa' : 'Apartamento'} de ${p.quartos} ${p.quartos === 1 ? 'quarto' : 'quartos'} em ${p.bairro}`
}

export function permutaToListing(permuta: Permuta): Listing {
    const land = permuta.tipo === 'terreno'
    const where = `${permuta.bairro}, ${permuta.cidade}`

    const rooms = `${permuta.quartos} ${permuta.quartos === 1 ? 'quarto' : 'quartos'}`
    const built = permuta.tipo === 'casa'
        ? `Casa de ${rooms}, com ${number(permuta.area)} m² construídos${permuta.areaTerreno ? ` em terreno de ${number(permuta.areaTerreno)} m²` : ''}, em ${where}.`
        : `Apartamento de ${rooms}, com ${number(permuta.area)} m² privativos${permuta.condominio ? `, no ${permuta.condominio}` : ''}, em ${where}.`

    const lines = [
        land ? `Terreno de ${number(permuta.area)} m² em ${where}.` : built,
        permuta.valorCondominio ? `Taxa de condomínio: ${money(permuta.valorCondominio)} por mês.` : '',
        'Imóvel à venda. Fale com a gente para conhecer as condições e agendar uma visita.'
    ]

    return Listing.create({
        slug: `permuta-${permuta.id}`,
        title: (TITLES[permuta.tipo] ?? TITLES.default)(permuta),
        category: ListingCategory.USED,
        type: permuta.tipo,
        status: permuta.status ?? 'published',
        price: permuta.valor,
        city: permuta.cidade,
        state: 'GO',
        neighborhood: permuta.bairro,
        address: permuta.condominio,
        bedrooms: permuta.quartos,
        suites: permuta.suites ?? 0,
        bathrooms: 0,
        parking: permuta.vagas ?? 0,
        area: permuta.area,
        description: lines.filter(Boolean).join('\n\n'),
        features: permuta.destaques ?? [],
        photos: permuta.fotos ?? [],
        developer: null,
        deliveryDate: null,
        constructionProgress: null,
        featured: false
    })
}

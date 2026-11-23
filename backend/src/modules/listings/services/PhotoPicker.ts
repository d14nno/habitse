import { DriveEntry } from './DriveFolder'
import { slugForName } from './PriceTableSync'

/**
 * Escolha das fotos de cada empreendimento na pasta do Drive. As pastas variam muito de um empreendimento para o outro
 * (decorado, perspectivas, áreas comuns, fachada…), então a regra é por nome: o que não serve fica de fora e, do que
 * serve, entra um pouco de cada pasta (as imagens de projeto primeiro, depois áreas comuns, depois o decorado).
 */
export const IMAGE_FILE = /\.(jpe?g|png|webp)$/i

/** Pastas que não são fotos do imóvel (divulgação, vídeos, tour, versões em baixa resolução…) */
export const SKIPPED_FOLDER = /redes sociais|baixa|folder|tour|v[ií]deo|institucional|campanha|material|book|mapa|localiza/i

/** Menor número = entra primeiro na capa e na galeria */
export function folderPriority(path: string): number {
    const name = path.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

    if (/perspectiva|fachada|empreendimento entregue/.test(name)) return 0
    if (/lazer|areas comuns|servicos/.test(name)) return 1
    if (/tipo|apartamento/.test(name)) return 2
    if (/decorad|modelo/.test(name)) return 3

    return 4
}

export interface PhotoGroup {
    path: string
    files: DriveEntry[]
}

const naturalOrder = (a: DriveEntry, b: DriveEntry) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true })

const stem = (name: string) => name.replace(/\.[^.]+$/, '').toLowerCase()

/** Arquivo de fachada pelo nome ("FACHADA 001.png", "BAM_ARES_FACHADA_4.1_ALTA.jpg") */
export const isFacade = (name: string) => /fachada|facade/i.test(name)

/** Foto escolhida: o arquivo do Drive e a pasta de onde veio */
export type PickedPhoto = DriveEntry & { path: string }

const LEISURE_FOLDER = /lazer|areas comuns|servicos/
const LEISURE_FILE = /academia|piscina|lazer|brinquedoteca|gourmet|sal[aã]o|market|sauna|rooftop|playground|coworking|quadra|lounge|festas|cinema|churrasq|beauty|relax|terra[cç]o|(?:^|[^a-z])(?:bar|spa|pet|wash|meet|work)(?:[^a-z]|$)/i

/** "fachada" (abre a galeria), "lazer" (áreas comuns) ou vazio, pelo nome do arquivo e da pasta */
export function photoTag(path: string, name: string): 'fachada' | 'lazer' | '' {
    if (isFacade(name)) return 'fachada'

    const folder = path.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

    return LEISURE_FOLDER.test(folder) || LEISURE_FILE.test(name) ? 'lazer' : ''
}

/** Quantas fachadas abrem a galeria (a primeira é a capa) */
const FACADES_FIRST = 2

/**
 * Até `limit` fotos. A fachada vem primeiro (a capa do empreendimento); depois, pela prioridade da pasta, uma rodada de
 * cada pasta por vez (espaçadas dentro da pasta, para não repetir ângulo).
 */
export function pickPhotos(groups: PhotoGroup[], limit = 12): PickedPhoto[] {
    const all = groups.flatMap(group => group.files.map(file => ({ ...file, path: group.path }))).filter(file => file.kind === 'file' && IMAGE_FILE.test(file.name))
    // O mesmo arquivo costuma existir em dois formatos (FACHADA (1).jpg e .jpeg): conta uma vez só
    const facades = all.filter(file => isFacade(file.name)).sort(naturalOrder).filter((file, index, list) => list.findIndex(other => stem(other.name) === stem(file.name)) === index).slice(0, FACADES_FIRST)
    const taken = new Set(facades.map(file => stem(file.name)))
    const rest = pickRound(groups.map(group => ({ ...group, files: group.files.filter(file => !taken.has(stem(file.name))) })), limit - facades.length)

    return [...facades, ...rest]
}

function pickRound(groups: PhotoGroup[], limit: number): PickedPhoto[] {
    const ordered = groups
        .map(group => ({ ...group, files: group.files.filter(file => file.kind === 'file' && IMAGE_FILE.test(file.name)).sort(naturalOrder) }))
        .filter(group => group.files.length)
        .sort((a, b) => folderPriority(a.path) - folderPriority(b.path) || a.path.localeCompare(b.path))

    if (!ordered.length || limit <= 0) return []

    const quota = Math.max(1, Math.ceil(limit / ordered.length))
    const spread = ordered.map(group => {
        const take = Math.min(quota, group.files.length)

        return Array.from({ length: take }, (_, index) => ({ ...group.files[Math.floor((index * group.files.length) / take)], path: group.path }))
    })

    const picked: PickedPhoto[] = []
    for (let round = 0; picked.length < limit && round < quota; round++) {
        for (const list of spread) if (list[round] && picked.length < limit) picked.push(list[round])
    }

    return picked
}

/** Pasta do empreendimento no Drive → endereço do anúncio ("5 - Praça 232" → praca-232) */
export const slugForFolder = (name: string) => slugForName(name)

/** Pasta de permuta → endereço do anúncio de permuta */
const PERMUTA_FOLDERS: [RegExp, string][] = [
    [/santos dumont/, 'permuta-lote-santos-dumont'],
    [/palco/, 'permuta-palco-vaca-brava'],
    [/madri/, 'permuta-sobrado-jardins-madri'],
    [/nova suica/, 'permuta-sobrado-nova-suica'],
    [/talisma/, 'permuta-lote-talisma'],
    [/estevao/, 'permuta-edificio-estevao'],
    [/gran campinas/, 'permuta-gran-campinas'],
    [/garavelo/, 'permuta-lote-garavelo']
]

export function slugForPermutaFolder(name: string): string | null {
    const folded = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

    return PERMUTA_FOLDERS.find(([pattern]) => pattern.test(folded))?.[1] ?? null
}

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

/** Até `limit` fotos: prioridade da pasta, depois uma rodada de cada pasta por vez (espaçadas dentro da pasta, para não repetir ângulo) */
export function pickPhotos(groups: PhotoGroup[], limit = 12): DriveEntry[] {
    const ordered = groups
        .map(group => ({ ...group, files: group.files.filter(file => file.kind === 'file' && IMAGE_FILE.test(file.name)).sort(naturalOrder) }))
        .filter(group => group.files.length)
        .sort((a, b) => folderPriority(a.path) - folderPriority(b.path) || a.path.localeCompare(b.path))

    if (!ordered.length) return []

    const quota = Math.max(1, Math.ceil(limit / ordered.length))
    const spread = ordered.map(group => {
        const take = Math.min(quota, group.files.length)

        return Array.from({ length: take }, (_, index) => group.files[Math.floor((index * group.files.length) / take)])
    })

    const picked: DriveEntry[] = []
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

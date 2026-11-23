import { DriveFolder } from './DriveFolder'
import { monthLabel, parsePriceTable, PriceTable } from './PriceTable'

/** O que a tabela do mês diz de cada empreendimento (arquivo `data/bambui-tabelas.json`, gravado só pela rotina) */
export interface TableInfo {
    /** AAAA-MM da tabela */
    month: string
    /** Menor valor entre as unidades disponíveis, em reais */
    priceFrom: number
    availableCount: number
    /** AAAA-MM da entrega das chaves, quando a tabela traz */
    keysDate: string | null
    /** Linha do registro de incorporação citada na tabela */
    registry: string | null
}

export type TableInfos = Record<string, TableInfo>

/** Nome do PDF na pasta "0 - TABELAS" → endereço do anúncio. A ordem importa ("ares marista" antes de "marista 262") */
export const TABLE_FILES: { pattern: RegExp, slug: string }[] = [
    { pattern: /areiao/, slug: 'areiao-1141' },
    { pattern: /ares/, slug: 'ares-marista' },
    { pattern: /bosque/, slug: 'b-great-bosque-dos-buritis' },
    { pattern: /nova suica/, slug: 'bgreat-nova-suica' },
    { pattern: /marista 262/, slug: 'marista-262' },
    { pattern: /praca/, slug: 'praca-232' },
    { pattern: /vox/, slug: 'vox-home' }
]

const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Nome (de arquivo ou de pasta) → endereço do anúncio do empreendimento */
export const slugForName = (name: string) => TABLE_FILES.find(({ pattern }) => pattern.test(fold(name)))?.slug ?? null

export const slugForTableFile = (name: string) => (/\.pdf$/i.test(name) ? slugForName(name) : null)

export function toTableInfo(table: PriceTable): TableInfo | null {
    if (!table.month || table.priceFrom === null) return null

    return { month: table.month, priceFrom: table.priceFrom, availableCount: table.availableCount, keysDate: table.keysDate, registry: table.registry }
}

export type PdfText = (pdf: Buffer) => Promise<string>

/**
 * Baixa as tabelas do mês da pasta do Drive e lê o preço "a partir de" de cada empreendimento.
 * Se faltar alguma tabela ou alguma não puder ser lida, lança erro: o arquivo anterior continua valendo.
 */
export async function readTables(drive: DriveFolder, rootFolderId: string, pdfText: PdfText, expected: string[] = TABLE_FILES.map(file => file.slug)): Promise<TableInfos> {
    const folder = (await drive.list(rootFolderId)).find(entry => entry.kind === 'folder' && /^0\s*-\s*tabelas/.test(fold(entry.name)))
    if (!folder) throw new Error('A pasta "0 - TABELAS" não foi encontrada na pasta do Drive.')

    const infos: TableInfos = {}

    for (const entry of await drive.list(folder.id)) {
        const slug = entry.kind === 'file' ? slugForTableFile(entry.name) : null
        if (!slug) continue
        if (infos[slug]) throw new Error(`Há mais de uma tabela de "${slug}" na pasta (${entry.name}). Deixe só a do mês.`)

        const info = toTableInfo(parsePriceTable(await pdfText(await drive.download(entry.id))))
        if (!info) throw new Error(`Não foi possível ler preço e mês na tabela "${entry.name}".`)

        infos[slug] = info
    }

    const missing = expected.filter(slug => !infos[slug])
    if (missing.length) throw new Error(`Faltam tabelas na pasta: ${missing.join(', ')}.`)

    return infos
}

/**
 * Tabelas antigas não valem: passados dois meses sem atualizar, o empreendimento volta a "sob consulta"
 * (melhor sem preço do que com preço velho).
 */
export const isFresh = (info: TableInfo, now: Date) => {
    const [year, month] = info.month.split('-').map(Number)

    return (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month) <= 2
}

export const priceNote = (info: TableInfo) => `Tabela de ${monthLabel(info.month)} · ${info.availableCount} ${info.availableCount === 1 ? 'unidade disponível' : 'unidades disponíveis'}`

/**
 * A tabela nova vira no primeiro dia útil do mês (dia 1 se for segunda a sexta; senão a segunda seguinte; feriados não entram).
 * A rotina tenta desse dia até o dia 7, para pegar a tabela mesmo que ela suba no Drive um pouco depois.
 */
export function isTableWindow(date: Date) {
    const first = new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    const firstBusinessDay = first === 6 ? 3 : first === 0 ? 2 : 1

    return date.getDate() >= firstBusinessDay && date.getDate() <= 7
}

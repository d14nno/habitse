/**
 * Leitura de uma pasta PÚBLICA do Google Drive (a Bambuí compartilha "qualquer pessoa com o link"), sem chave de API:
 * a lista vem da página de visualização incorporada e o arquivo, do endereço de download público.
 */
export interface DriveEntry {
    id: string
    name: string
    kind: 'folder' | 'file'
}

export type DriveFetch = (url: string) => Promise<{ ok: boolean, status: number, text(): Promise<string>, arrayBuffer(): Promise<ArrayBuffer> }>

const UA = { 'User-Agent': 'Mozilla/5.0 (HabitseImport; catálogo dos empreendimentos da própria Bambuí)' }

const unescapeHtml = (text: string) => text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))

/** Itens de uma pasta a partir do HTML da visualização incorporada */
export function parseFolderPage(html: string): DriveEntry[] {
    const entries: DriveEntry[] = []
    const pattern = /<div class="flip-entry" id="entry-([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]*)<\/div>/g
    let match: RegExpExecArray | null

    while ((match = pattern.exec(html))) {
        const around = html.slice(match.index, match.index + 1500)
        const link = around.match(/href="(https:\/\/drive\.google\.com\/(?:drive\/folders|file\/d|open\?id=)[^"]+)"/)

        if (link) entries.push({ id: match[1], name: unescapeHtml(match[2]).trim(), kind: unescapeHtml(link[1]).includes('/folders/') ? 'folder' : 'file' })
    }

    return entries
}

export class DriveFolder {
    constructor(private readonly get: DriveFetch = (url: string) => fetch(url, { headers: UA })) { }

    async list(folderId: string): Promise<DriveEntry[]> {
        const response = await this.get(`https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}`)
        if (!response.ok) throw new Error(`Google Drive respondeu ${response.status} ao listar a pasta ${folderId} (a pasta continua pública?)`)

        return parseFolderPage(await response.text())
    }

    async download(fileId: string): Promise<Buffer> {
        const response = await this.get(`https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`)
        if (!response.ok) throw new Error(`Google Drive respondeu ${response.status} ao baixar o arquivo ${fileId}`)

        return Buffer.from(await response.arrayBuffer())
    }
}

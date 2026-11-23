import { DriveFetch, DriveFolder } from './DriveFolder'
import { isFresh, isTableWindow, priceNote, readTables, slugForTableFile } from './PriceTableSync'

const page = (entries: [string, string, 'folder' | 'file'][]) => entries.map(([id, name, kind]) => `<div class="flip-entry" id="entry-${id}"><a href="https://drive.google.com/${kind === 'folder' ? `drive/folders/${id}` : `file/d/${id}/view`}">x</a><div class="flip-entry-title">${name}</div></div>`).join('')

const TABLE = (month: string, price: string) => `X - ${month}\nSITUAÇÃO\n101\n80 m²\nDisponível\nR$${price}\n`

function drive(files: Record<string, string>, listings: Record<string, string>): DriveFolder {
    const get: DriveFetch = async url => {
        const id = decodeURIComponent(url.match(/id=([^&]+)/)![1])
        const body = url.includes('embeddedfolderview') ? listings[id] : files[id]

        return { ok: body !== undefined, status: body === undefined ? 404 : 200, text: async () => body, arrayBuffer: async () => Buffer.from(body ?? '') }
    }

    return new DriveFolder(get)
}

describe('arquivos da pasta de tabelas', () => {
    it('reconhece o empreendimento pelo nome do PDF (com e sem acento) e ignora o que não é PDF', () => {
        expect(slugForTableFile('Areião 1141 - Tabela Novembro 2026.pdf')).toBe('areiao-1141')
        expect(slugForTableFile('Ares Marista - Tabela Novembro 2026.pdf')).toBe('ares-marista')
        expect(slugForTableFile('Marista 262 - Tabela Novembro 2026.pdf')).toBe('marista-262')
        expect(slugForTableFile('B Great Nova Suíça - Tabela Novembro 2026.pdf')).toBe('bgreat-nova-suica')
        expect(slugForTableFile('** Tabela Especial - Válida por tempo limitado')).toBeNull()
        expect(slugForTableFile('Planilha qualquer.pdf')).toBeNull()
    })
})

describe('leitura das tabelas no Drive', () => {
    const listings = {
        raiz: page([['t', '0 - TABELAS ', 'folder'], ['p8', '8 - Permutas', 'folder']]),
        t: page([['a', 'Praça 232 - Tabela Novembro 2026.pdf', 'file'], ['b', 'Vox Home - Tabela Novembro 2026.pdf', 'file'], ['c', '** Tabela Especial', 'file']])
    }
    const files = { a: TABLE('NOVEMBRO/26', '1.500.000,00'), b: TABLE('NOVEMBRO/26', '900.000,00'), c: 'ignorado' }
    const text = async (buffer: Buffer) => buffer.toString()

    it('lê cada tabela e devolve o preço a partir de', async () => {
        const infos = await readTables(drive(files, listings), 'raiz', text, ['praca-232', 'vox-home'])

        expect(infos['praca-232']).toMatchObject({ month: '2026-11', priceFrom: 1500000, availableCount: 1 })
        expect(infos['vox-home'].priceFrom).toBe(900000)
    })

    it('falta de tabela, pasta ausente ou tabela ilegível interrompem tudo (nada é gravado)', async () => {
        await expect(readTables(drive(files, listings), 'raiz', text, ['praca-232', 'vox-home', 'marista-262'])).rejects.toThrow('Faltam tabelas na pasta: marista-262')
        await expect(readTables(drive(files, { raiz: page([['p8', '8 - Permutas', 'folder']]) }), 'raiz', text, [])).rejects.toThrow('"0 - TABELAS" não foi encontrada')
        await expect(readTables(drive({ ...files, a: 'sem tabela' }, listings), 'raiz', text, [])).rejects.toThrow('Não foi possível ler preço e mês')
        await expect(readTables(drive(files, {}), 'raiz', text, [])).rejects.toThrow('respondeu 404')
    })
})

describe('validade da tabela', () => {
    const info = { month: '2026-11', priceFrom: 1, availableCount: 40, keysDate: null, registry: null }

    it('vale no mês e nos dois seguintes; depois disso o preço volta a "sob consulta"', () => {
        expect(isFresh(info, new Date(2026, 10, 25))).toBe(true)
        expect(isFresh(info, new Date(2027, 0, 20))).toBe(true)
        expect(isFresh(info, new Date(2027, 1, 1))).toBe(false)
    })

    it('observação sob o preço no singular e no plural', () => {
        expect(priceNote(info)).toBe('Tabela de novembro de 2026 · 40 unidades disponíveis')
        expect(priceNote({ ...info, availableCount: 1 })).toBe('Tabela de novembro de 2026 · 1 unidade disponível')
    })
})

describe('janela de leitura mensal', () => {
    it('do primeiro dia útil até o dia 7 (novembro/2026 começa num domingo; setembro/2026, numa terça)', () => {
        expect(isTableWindow(new Date(2026, 10, 1))).toBe(false)
        expect(isTableWindow(new Date(2026, 10, 2))).toBe(true)
        expect(isTableWindow(new Date(2026, 10, 7))).toBe(true)
        expect(isTableWindow(new Date(2026, 10, 8))).toBe(false)
        expect(isTableWindow(new Date(2026, 8, 1))).toBe(true)
        expect(isTableWindow(new Date(2026, 10, 25))).toBe(false)
    })

    it('mês que começa no sábado: o primeiro dia útil é o dia 3', () => {
        expect(isTableWindow(new Date(2026, 7, 1))).toBe(false)
        expect(isTableWindow(new Date(2026, 7, 2))).toBe(false)
        expect(isTableWindow(new Date(2026, 7, 3))).toBe(true)
    })
})

import { DriveEntry } from './DriveFolder'
import { folderPriority, isFacade, photoTag, pickPhotos, slugForFolder, slugForPermutaFolder } from './PhotoPicker'

const files = (prefix: string, count: number): DriveEntry[] => Array.from({ length: count }, (_, index) => ({ id: `${prefix}${index + 1}`, name: `${prefix} (${index + 1}).jpg`, kind: 'file' as const }))

describe('escolha das fotos', () => {
    it('projeto e fachada vêm antes de áreas comuns, que vêm antes do decorado', () => {
        expect(['02 - Imagens/Perspectivas', 'FACHADA', 'Áreas Comuns', 'Fotos Decorado', 'Outros'].map(folderPriority)).toEqual([0, 0, 1, 3, 4])
    })

    it('pega um pouco de cada pasta (espaçado), a capa é da pasta de maior prioridade e só entram imagens', () => {
        const picked = pickPhotos([
            { path: 'decorado', files: [...files('d', 30), { id: 'x', name: 'video.mp4', kind: 'file' }] },
            { path: 'Perspectivas', files: files('p', 20) },
            { path: 'vazia', files: [] }
        ], 12)

        expect(picked).toHaveLength(12)
        expect(picked[0].id.startsWith('p')).toBe(true)
        expect(picked.filter(entry => entry.id.startsWith('p'))).toHaveLength(6)
        expect(picked.filter(entry => entry.id.startsWith('d'))).toHaveLength(6)
        expect(new Set(picked.map(entry => entry.id)).size).toBe(12)
        expect(picked.map(entry => entry.id)).not.toContain('x')
    })

    it('poucas imagens: usa todas; nenhuma: lista vazia', () => {
        expect(pickPhotos([{ path: 'a', files: files('a', 3) }], 12)).toHaveLength(3)
        expect(pickPhotos([{ path: 'a', files: [] }])).toEqual([])
    })

    it('reconhece o anúncio pela pasta do empreendimento ou da permuta', () => {
        expect(slugForFolder('5 - Praça 232')).toBe('praca-232')
        expect(slugForFolder('9 - Institucional')).toBeNull()
        expect(slugForPermutaFolder('Edifício Estêvão - Setor Leste Vila Nova')).toBe('permuta-edificio-estevao')
        expect(slugForPermutaFolder('Lote Parqville Quaresmeira')).toBeNull()
    })
})

describe('fachada primeiro', () => {
    const file = (id: string, name: string): DriveEntry => ({ id, name, kind: 'file' })

    it('a capa é a fachada, mesmo vindo de outra pasta; sem repetir o mesmo arquivo em dois formatos', () => {
        const picked = pickPhotos([
            { path: 'decorado', files: [file('d1', 'SALA.jpg'), file('d2', 'COZINHA.jpg')] },
            { path: 'Perspectivas', files: [file('a', 'ACADEMIA.png'), file('f2', 'FACHADA 2.png'), file('f1', 'FACHADA 1.png'), file('f1b', 'FACHADA 1.jpg'), file('f3', 'Fachada 3.png')] }
        ], 6)

        expect(picked.slice(0, 2).map(entry => entry.id)).toEqual(['f1b', 'f2'])
        expect(new Set(picked.map(entry => entry.id)).size).toBe(picked.length)
        expect(picked.map(entry => entry.id)).not.toContain('f1')
    })

    it('sem arquivo de fachada, segue a regra de antes; reconhece o nome', () => {
        expect(pickPhotos([{ path: 'a', files: [file('1', 'SALA.jpg')] }], 12).map(entry => entry.id)).toEqual(['1'])
        expect(isFacade('BAM_ARES_FACHADA_4.1_ALTA.jpg')).toBe(true)
        expect(isFacade('Fachada.jpg')).toBe(true)
        expect(isFacade('LIVING.jpg')).toBe(false)
    })
})

describe('marca da foto: fachada, lazer ou nenhuma', () => {
    it('reconhece pelo nome do arquivo e pela pasta', () => {
        expect(photoTag('02 - FOTOS/Perspectivas', 'BAM_ARES_FACHADA_6_ALTA.jpg')).toBe('fachada')
        expect(photoTag('02 - FOTOS/Perspectivas', 'BAM_ARES_BAR_2_ALTA.jpg')).toBe('lazer')
        expect(photoTag('02 - FOTOS/Perspectivas', 'Academia BGreat Bosque dos Buritis.png')).toBe('lazer')
        expect(photoTag('02 - Imagens/Perspectivas/02 - Lazer e Serviços', 'IMG 12.png')).toBe('lazer')
        expect(photoTag('IMAGENS/ÁREAS COMUNS', 'foto.jpg')).toBe('lazer')
        expect(photoTag('02 - FOTOS/Decorado', 'SALA 1.jpg')).toBe('')
        expect(photoTag('02 - FOTOS/Decorado', 'CARPETE.jpg')).toBe('')
    })

    it('a foto escolhida leva o caminho da pasta de origem', () => {
        const picked = pickPhotos([{ path: 'Perspectivas', files: [{ id: '1', name: 'LIVING.jpg', kind: 'file' }] }], 12)

        expect(picked[0]).toMatchObject({ id: '1', path: 'Perspectivas' })
    })
})

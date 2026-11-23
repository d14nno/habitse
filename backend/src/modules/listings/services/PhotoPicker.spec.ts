import { DriveEntry } from './DriveFolder'
import { folderPriority, pickPhotos, slugForFolder, slugForPermutaFolder } from './PhotoPicker'

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

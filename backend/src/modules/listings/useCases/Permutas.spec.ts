import 'reflect-metadata'

import { AuditService } from '@modules/audit/services/AuditService'
import { InMemoryPermutaRepository } from '../infra/InMemoryPermutaRepository'
import { ListPermutasUseCase, PermutaCatalogUseCase, PermutaInput, RemovePermutaUseCase, SavePermutaUseCase } from './PermutaUseCases'

const input: PermutaInput = { tipo: 'apartamento', cidade: 'Goiânia', bairro: 'Setor Bueno', condominio: 'Edifício X', quartos: 3, area: 90, valor: 700000, valorCondominio: 800, place: { lat: -16.7, lng: -49.27, approx: true } }
const actor = { id: 1 }

describe('Permutas do painel', () => {
    let repository: InMemoryPermutaRepository
    let save: SavePermutaUseCase
    const logged: unknown[] = []

    beforeEach(() => {
        repository = new InMemoryPermutaRepository()
        logged.length = 0
        const audit = { log: async (_actor: unknown, entry: unknown) => void logged.push(entry) } as unknown as AuditService
        save = new SavePermutaUseCase(repository, audit)
    })

    it('cria, edita e audita', async () => {
        await save.execute('apto-bueno', input, actor)
        const edited = await save.execute('apto-bueno', { ...input, valor: 650000 }, actor)

        expect(edited.valor).toBe(650000)
        expect(await new ListPermutasUseCase(repository).execute()).toHaveLength(1)
        expect(logged.map(entry => (entry as { action: string }).action)).toEqual(['permuta.create', 'permuta.update'])
    })

    it('recusa dados inválidos', async () => {
        await expect(save.execute('apto-bueno', { ...input, valor: -1 }, actor)).rejects.toMatchObject({ statusCode: 422 })
        await expect(save.execute('Apto Bueno', input, actor)).rejects.toMatchObject({ statusCode: 422 })
    })

    it('remove e recusa o que não existe', async () => {
        await save.execute('apto-bueno', input, actor)
        const audit = { log: async () => undefined } as unknown as AuditService
        const remove = new RemovePermutaUseCase(repository, audit)

        await remove.execute('apto-bueno', actor)
        await expect(remove.execute('apto-bueno', actor)).rejects.toMatchObject({ statusCode: 404 })
    })

    it('publica no catálogo só o que está publicado, com a posição pelo endereço do anúncio', async () => {
        await save.execute('apto-bueno', input, actor)
        await save.execute('rascunho', { ...input, status: 'draft' }, actor)

        const { catalog, places } = await new PermutaCatalogUseCase(repository).execute()

        expect(catalog.items.map(item => item.slug)).toEqual(['permuta-apto-bueno'])
        expect(places['permuta-apto-bueno']).toEqual({ lat: -16.7, lng: -49.27, approx: true })
    })
})

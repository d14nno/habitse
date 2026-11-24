import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { AdminActor, AuditService } from '@modules/audit/services/AuditService'
import { PermutaPlace, PermutaRepository, StoredPermuta } from '../repositories/PermutaRepository'
import { Permuta, permutaToListing, validatePermutas } from '../services/PermutaCatalog'
import { buildCatalog, Catalog } from '../services/StaticCatalog'

export interface PermutaInput extends Omit<Permuta, 'id'> {
    place?: PermutaPlace | null
}

const view = ({ permuta, place, updatedAt }: StoredPermuta) => ({ ...permuta, place, updatedAt })

const invalid = (errors: string[]) => new AppError(errors.map(message => ({ message, uniqueCode: 'PERMUTA:INVALID' })), 422)

@injectable()
export class ListPermutasUseCase {
    constructor(@inject('PermutaRepository') private permutas: PermutaRepository) { }

    async execute() {
        return (await this.permutas.list()).map(view)
    }
}

@injectable()
export class SavePermutaUseCase {
    constructor(
        @inject('PermutaRepository') private permutas: PermutaRepository,
        @inject(AuditService) private audit: AuditService
    ) { }

    async execute(id: string, input: PermutaInput, actor: AdminActor) {
        const { place = null, ...fields } = input
        const { file, errors } = validatePermutas({ referencia: '2026-01', imoveis: [{ ...fields, id }] })
        if (!file) throw invalid(errors)

        const existed = await this.permutas.find(id)
        const saved = await this.permutas.save(file.imoveis[0], place)
        await this.audit.log(actor, { action: existed ? 'permuta.update' : 'permuta.create', entityType: 'permuta', entityId: id, data: { valor: saved.permuta.valor, status: saved.permuta.status ?? 'published' } })

        return view(saved)
    }
}

@injectable()
export class RemovePermutaUseCase {
    constructor(
        @inject('PermutaRepository') private permutas: PermutaRepository,
        @inject(AuditService) private audit: AuditService
    ) { }

    async execute(id: string, actor: AdminActor): Promise<void> {
        if (!(await this.permutas.remove(id))) throw new AppError([{ message: 'Permuta não encontrada', uniqueCode: 'PERMUTA:NOT_FOUND' }], 404)
        await this.audit.log(actor, { action: 'permuta.delete', entityType: 'permuta', entityId: id })
    }
}

/**
 * Permutas publicadas pelo painel, no mesmo formato do catálogo estático. O site troca as permutas do arquivo por estas
 * quando houver alguma aqui; sem nenhuma, o arquivo continua valendo.
 */
@injectable()
export class PermutaCatalogUseCase {
    constructor(@inject('PermutaRepository') private permutas: PermutaRepository) { }

    async execute(): Promise<{ catalog: Catalog, places: Record<string, PermutaPlace> }> {
        const stored = await this.permutas.list()
        const catalog = buildCatalog(stored.map(({ permuta }) => permutaToListing(permuta)), {}, null)
        const places = Object.fromEntries(stored.filter(({ place }) => place).map(({ permuta, place }) => [`permuta-${permuta.id}`, place as PermutaPlace]))

        return { catalog, places }
    }
}

import { connection } from '@shared/infra/knex'
import { Permuta } from '../services/PermutaCatalog'
import { PermutaPlace, PermutaRepository, StoredPermuta } from '../repositories/PermutaRepository'

const TABLE = 'listings.permutas'

const toStored = (row: any): StoredPermuta => ({
    permuta: row.data as Permuta,
    place: row.lat === null || row.lng === null ? null : { lat: Number(row.lat), lng: Number(row.lng), approx: !!row.approx },
    updatedAt: row.updatedAt
})

export class KnexPermutaRepository implements PermutaRepository {
    async list(): Promise<StoredPermuta[]> {
        return (await connection(TABLE).orderBy('id')).map(toStored)
    }

    async find(id: string): Promise<StoredPermuta | null> {
        const row = await connection(TABLE).where({ id }).first()
        return row ? toStored(row) : null
    }

    async save(permuta: Permuta, place: PermutaPlace | null): Promise<StoredPermuta> {
        const row = { id: permuta.id, data: JSON.stringify(permuta), lat: place?.lat ?? null, lng: place?.lng ?? null, approx: place?.approx ?? true, updatedAt: new Date() }
        const [saved] = await connection(TABLE).insert(row).onConflict('id').merge().returning('*')
        return toStored(saved)
    }

    async remove(id: string): Promise<boolean> {
        return (await connection(TABLE).where({ id }).del()) > 0
    }
}

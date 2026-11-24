import { Permuta } from '../services/PermutaCatalog'
import { PermutaPlace, PermutaRepository, StoredPermuta } from '../repositories/PermutaRepository'

export class InMemoryPermutaRepository implements PermutaRepository {
    items = new Map<string, StoredPermuta>()

    async list(): Promise<StoredPermuta[]> {
        return Array.from(this.items.values()).sort((a, b) => a.permuta.id.localeCompare(b.permuta.id))
    }

    async find(id: string): Promise<StoredPermuta | null> {
        return this.items.get(id) ?? null
    }

    async save(permuta: Permuta, place: PermutaPlace | null): Promise<StoredPermuta> {
        const stored = { permuta, place, updatedAt: new Date() }
        this.items.set(permuta.id, stored)
        return stored
    }

    async remove(id: string): Promise<boolean> {
        return this.items.delete(id)
    }
}

import { Permuta } from '../services/PermutaCatalog'

export interface PermutaPlace { lat: number, lng: number, approx: boolean }
export interface StoredPermuta { permuta: Permuta, place: PermutaPlace | null, updatedAt: Date }

export interface PermutaRepository {
    list(): Promise<StoredPermuta[]>
    find(id: string): Promise<StoredPermuta | null>
    /** Cria ou substitui. `place` null apaga a posição. */
    save(permuta: Permuta, place: PermutaPlace | null): Promise<StoredPermuta>
    remove(id: string): Promise<boolean>
}

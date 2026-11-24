import type { ListingCard } from '@/types/Listing'

export interface Place { lat: number, lng: number, approx: boolean }
export type Places = Record<string, Place>

export interface MapPoint { listing: ListingCard, lat: number, lng: number, approx: boolean }

/** Raio do círculo que representa a região quando o ponto exato não é divulgado (metros) */
export const APPROX_RADIUS = 600

const valid = (place: unknown): place is Place => {
    const p = place as Place | null
    return !!p && typeof p.lat === 'number' && typeof p.lng === 'number' && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180
}

/** Junta os anúncios às posições; quem não tem posição cadastrada fica de fora (e é contado à parte) */
export function buildPoints(listings: ListingCard[], places: Places): { points: MapPoint[], missing: number } {
    const points: MapPoint[] = []
    for (const listing of listings) {
        const place = places[listing.slug]
        if (valid(place)) points.push({ listing, lat: place.lat, lng: place.lng, approx: !!place.approx })
    }

    return { points, missing: listings.length - points.length }
}

/** Texto curto do pino: "1,1 mi" / "685 mil"; sem valor, um ponto */
export function pinLabel(price: number | null): string {
    if (!price || price <= 0) return '•'
    if (price >= 1_000_000) return `${(price / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`

    return `${Math.round(price / 1_000).toLocaleString('pt-BR')} mil`
}

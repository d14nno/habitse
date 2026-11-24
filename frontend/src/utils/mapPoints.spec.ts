import { describe, expect, it } from 'vitest'

import type { ListingCard } from '@/types/Listing'
import { buildPoints, pinLabel } from './mapPoints'

const card = (slug: string) => ({ slug }) as unknown as ListingCard

describe('pontos do mapa', () => {
    it('só entram anúncios com posição válida; os demais são contados', () => {
        const { points, missing } = buildPoints([card('a'), card('b'), card('c')], {
            a: { lat: -16.7, lng: -49.2, approx: false },
            b: { lat: 999, lng: -49.2, approx: false }
        })

        expect(points.map(point => point.listing.slug)).toEqual(['a'])
        expect(missing).toBe(2)
    })

    it('marca a posição aproximada', () => {
        expect(buildPoints([card('a')], { a: { lat: -16.7, lng: -49.2, approx: true } }).points[0].approx).toBe(true)
    })

    it('rótulo do pino', () => {
        expect(pinLabel(1108600)).toBe('1,1 mi')
        expect(pinLabel(685000)).toBe('685 mil')
        expect(pinLabel(null)).toBe('•')
    })
})

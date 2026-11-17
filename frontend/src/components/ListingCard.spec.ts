import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import { useFavorites } from '@/composables/useFavorites'
import type { ListingCard as Card } from '@/types/Listing'
import ListingCard from './ListingCard.vue'

const base: Card = {
    id: 1, slug: 'obra-1', title: 'Residencial Pôr do Sol', category: 'under_construction', categoryLabel: 'Em construção', categorySlug: 'em-construcao', type: 'apartamento',
    price: 559000, city: 'Goiânia', state: 'GO', neighborhood: 'Setor Bueno', bedrooms: 3, suites: 1, bathrooms: 2, parking: 2, area: 84, cover: '/a.svg', photoCount: 5,
    developer: 'Construtora X', deliveryDate: '2027-08', constructionProgress: 62, featured: false
}

const mountCard = (listing: Card) => mount(ListingCard, { props: { listing }, global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } } })

describe('ListingCard', () => {
    beforeEach(() => {
        localStorage.clear()
        const favorites = useFavorites()
        favorites.slugs.value = []
    })

    it('mostra valor, local, características, entrega e andamento da obra', () => {
        const text = mountCard(base).text()
        expect(text).toContain('R$')
        expect(text).toContain('559.000')
        expect(text).toContain('Setor Bueno, Goiânia')
        expect(text).toContain('3 quartos · 2 vagas · 84 m²')
        expect(text).toContain('Entrega ago/2027')
        expect(text).toContain('Obra 62% concluída')
        expect(text).toContain('5 fotos')
    })

    it('imóvel usado não mostra entrega nem andamento; sem valor vira "Sob consulta"', () => {
        const text = mountCard({ ...base, category: 'used', categoryLabel: 'Imóveis usados', deliveryDate: null, developer: null, constructionProgress: null, price: null }).text()
        expect(text).toContain('Sob consulta')
        expect(text).not.toContain('Entrega')
        expect(text).not.toContain('Obra')
    })

    it('o coração salva e remove dos favoritos (e guarda no aparelho)', async () => {
        const wrapper = mountCard(base)
        const button = wrapper.find('button.fav')
        await button.trigger('click')
        expect(useFavorites().has('obra-1')).toBe(true)
        expect(JSON.parse(localStorage.getItem('habitse:favoritos') ?? '[]')).toEqual(['obra-1'])
        expect(button.attributes('aria-pressed')).toBe('true')

        await button.trigger('click')
        expect(useFavorites().has('obra-1')).toBe(false)
    })
})

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

    it('mostra valor, local, características e entrega, sem a barra de andamento da obra', () => {
        const text = mountCard(base).text()
        expect(text).toContain('R$')
        expect(text).toContain('559.000')
        expect(text).toContain('Setor Bueno, Goiânia')
        expect(text).toContain('84 m² · 1 suíte · 2 vagas')
        expect(text).toContain('Em construção')
        expect(text).toContain('a partir de')
        expect(text).toContain('Entrega ago/2027')
        expect(text).not.toContain('concluída')
    })

    it('imóvel usado não mostra entrega nem andamento; sem valor vira "Sob consulta"', () => {
        const text = mountCard({ ...base, category: 'used', categoryLabel: 'Oportunidades de mercado', deliveryDate: null, developer: null, constructionProgress: null, price: null }).text()
        expect(text).toContain('Sob consulta')
        expect(text).toContain('Imóvel usado')
        expect(text).not.toContain('a partir de')
        expect(text).not.toContain('Entrega')
        expect(text).not.toContain('Obra')
    })

    it('imóvel de permuta aparece só como imóvel usado, sem menção a permuta, com o valor direto (sem "a partir de")', () => {
        const text = mountCard({ ...base, category: 'used', permuta: true, deliveryDate: null, developer: null, constructionProgress: null }).text()
        expect(text).toContain('Imóvel usado')
        expect(text).not.toMatch(/permuta|Bambuí/i)
        expect(text).not.toContain('a partir de')
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

describe('ListingCard: fotos que se passam', () => {
    it('com várias fotos mostra uma por vez, setas só quando há para onde ir; sem galeria usa a capa', () => {
        const wrapper = mountCard({ ...base, gallery: ['/1.jpg', '/2.jpg', '/3.jpg'] })

        expect(wrapper.findAll('img')).toHaveLength(3)
        expect(wrapper.find('img').attributes('alt')).toBe('Residencial Pôr do Sol')
        expect(wrapper.findAll('img')[1].attributes('alt')).toBe('')
        expect(wrapper.find('button[aria-label="Próxima foto"]').exists()).toBe(true)
        expect(wrapper.find('button[aria-label="Foto anterior"]').exists()).toBe(false)
        expect(mountCard(base).findAll('img')).toHaveLength(1)
        expect(mountCard(base).find('button[aria-label="Próxima foto"]').exists()).toBe(false)
    })
})

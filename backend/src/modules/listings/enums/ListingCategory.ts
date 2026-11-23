/**
 * As vitrines do site. `slug` é o que aparece na URL do site; `label` é o texto exibido.
 * `used` é a vitrine "Oportunidades de mercado" (imóveis de revenda e permuta); `ready` são os empreendimentos novos já prontos.
 */
export enum ListingCategory {
    READY = 'ready',
    USED = 'used',
    OFF_PLAN = 'off_plan',
    UNDER_CONSTRUCTION = 'under_construction'
}

export const LISTING_CATEGORIES = Object.values(ListingCategory)

export const CATEGORY_INFO: Record<ListingCategory, { slug: string, label: string, description: string }> = {
    [ListingCategory.READY]: { slug: 'prontos-para-morar', label: 'Prontos para morar', description: 'Empreendimentos já concluídos, para mudança imediata.' },
    [ListingCategory.USED]: { slug: 'oportunidades', label: 'Oportunidades de mercado', description: 'Imóveis usados, com a situação de cada um informada.' },
    [ListingCategory.OFF_PLAN]: { slug: 'na-planta', label: 'Lançamentos', description: 'Empreendimentos na planta, com projeto, previsão de entrega e valores da tabela vigente.' },
    [ListingCategory.UNDER_CONSTRUCTION]: { slug: 'em-construcao', label: 'Em construção', description: 'Obras em andamento, com o estágio da construção e a previsão de entrega.' }
}

export const LISTING_TYPES = ['apartamento', 'casa', 'cobertura', 'casa_condominio', 'terreno', 'sala_comercial'] as const
export type ListingType = typeof LISTING_TYPES[number]

export const LISTING_STATUSES = ['published', 'draft', 'sold'] as const
export type ListingStatus = typeof LISTING_STATUSES[number]

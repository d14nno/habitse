/** As três vitrines do site. `slug` é o que aparece na URL do site; `label` é o texto exibido. */
export enum ListingCategory {
    USED = 'used',
    OFF_PLAN = 'off_plan',
    UNDER_CONSTRUCTION = 'under_construction'
}

export const LISTING_CATEGORIES = Object.values(ListingCategory)

export const CATEGORY_INFO: Record<ListingCategory, { slug: string, label: string, description: string }> = {
    [ListingCategory.USED]: { slug: 'usados', label: 'Imóveis usados', description: 'Prontos para morar, com escritura e documentação em dia.' },
    [ListingCategory.OFF_PLAN]: { slug: 'na-planta', label: 'Na planta', description: 'Lançamentos com as melhores condições de entrada e valorização.' },
    [ListingCategory.UNDER_CONSTRUCTION]: { slug: 'em-construcao', label: 'Em construção', description: 'Obras em andamento, com previsão de entrega e acompanhamento do avanço.' }
}

export const LISTING_TYPES = ['apartamento', 'casa', 'cobertura', 'casa_condominio', 'terreno', 'sala_comercial'] as const
export type ListingType = typeof LISTING_TYPES[number]

export const LISTING_STATUSES = ['published', 'draft', 'sold'] as const
export type ListingStatus = typeof LISTING_STATUSES[number]

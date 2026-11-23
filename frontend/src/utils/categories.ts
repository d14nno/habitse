import type { CategoryKey } from '@/types/Listing'

export interface CategoryInfo {
    key: CategoryKey
    slug: string
    label: string
    short: string
    description: string
    /** Texto da situação do imóvel nos cartões */
    status: string
}

/** Ordem das vitrines no site. Todas usam a mesma identidade visual: a categoria se distingue pelo texto, não pela cor. */
export const CATEGORIES: CategoryInfo[] = [
    { key: 'ready', slug: 'prontos-para-morar', label: 'Prontos para morar', short: 'Prontos para morar', description: 'Empreendimentos já concluídos, para mudança imediata, com a situação de cada imóvel informada com clareza.', status: 'Pronto para morar' },
    { key: 'off_plan', slug: 'na-planta', label: 'Lançamentos', short: 'Lançamentos', description: 'Empreendimentos na planta, com projeto, previsão de entrega e valores da tabela vigente.', status: 'Lançamento' },
    { key: 'under_construction', slug: 'em-construcao', label: 'Em construção', short: 'Em construção', description: 'Obras em andamento, com o estágio da construção e a previsão de entrega sempre à vista.', status: 'Em construção' },
    { key: 'used', slug: 'oportunidades', label: 'Oportunidades de mercado', short: 'Oportunidades', description: 'Imóveis usados, com a situação de cada um informada.', status: 'Imóvel usado' }
]

export const ALL_SLUG = 'imoveis'

export const categoryBySlug = (slug: string) => CATEGORIES.find(category => category.slug === slug)
export const categoryByKey = (key: CategoryKey) => CATEGORIES.find(category => category.key === key)!

export const TYPE_LABELS: Record<string, string> = {
    apartamento: 'Apartamento',
    casa: 'Casa',
    cobertura: 'Cobertura',
    casa_condominio: 'Casa em condomínio',
    terreno: 'Terreno',
    sala_comercial: 'Sala comercial'
}

export const typeLabel = (type: string) => TYPE_LABELS[type] ?? type

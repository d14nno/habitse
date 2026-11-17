import type { CategoryKey } from '@/types/Listing'

export interface CategoryInfo {
    key: CategoryKey
    slug: string
    label: string
    short: string
    headline: string
    description: string
    /** Cor de identificação (cartões, selos, abas) */
    color: string
}

export const CATEGORIES: CategoryInfo[] = [
    { key: 'used', slug: 'usados', label: 'Imóveis usados', short: 'Usados', headline: 'Pronto para morar', description: 'Imóveis prontos, com escritura e documentação em dia. Mude-se rápido.', color: '#0b6b5d' },
    { key: 'off_plan', slug: 'na-planta', label: 'Na planta', short: 'Na planta', headline: 'Lançamentos', description: 'Compre na fase de lançamento, com entrada facilitada e parcelas até a entrega.', color: '#4f46e5' },
    { key: 'under_construction', slug: 'em-construcao', label: 'Em construção', short: 'Em construção', headline: 'Obra em andamento', description: 'Acompanhe o avanço da obra e escolha com previsão de entrega definida.', color: '#c2610c' }
]

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

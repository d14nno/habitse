import { ListingCategory, ListingStatus, ListingType } from '../enums/ListingCategory'

export interface ListingProps {
    id: number
    slug: string
    title: string
    category: ListingCategory
    type: ListingType
    status: ListingStatus
    /** Preço em reais, com 2 casas (null = sob consulta) */
    price: number | null
    city: string
    neighborhood: string
    state: string
    /** Endereço aproximado (nunca o número exato antes do contato) */
    address: string | null
    bedrooms: number
    suites: number
    bathrooms: number
    parking: number
    /** Área privativa em m² */
    area: number | null
    description: string
    features: string[]
    /** URLs das fotos (a primeira é a capa) */
    photos: string[]
    /** Construtora/incorporadora (planta e construção) */
    developer: string | null
    /** Previsão de entrega, YYYY-MM (planta e construção) */
    deliveryDate: string | null
    /** Andamento da obra em % (só em construção) */
    constructionProgress: number | null
    featured: boolean
    createdAt: Date
    updatedAt: Date
}

export class Listing {
    constructor(public readonly props: ListingProps) { }

    get id() { return this.props.id }
    get slug() { return this.props.slug }
    get category() { return this.props.category }
    get isPublished() { return this.props.status === 'published' }

    static create(props: Omit<ListingProps, 'id' | 'createdAt' | 'updatedAt'> & Partial<Pick<ListingProps, 'id' | 'createdAt' | 'updatedAt'>>): Listing {
        const now = new Date()
        return new Listing({
            ...props,
            id: props.id ?? 0,
            // Andamento só faz sentido em obra; data de entrega só fora de imóveis usados
            constructionProgress: props.category === ListingCategory.UNDER_CONSTRUCTION ? props.constructionProgress ?? 0 : null,
            deliveryDate: props.category === ListingCategory.USED ? null : props.deliveryDate,
            createdAt: props.createdAt ?? now,
            updatedAt: props.updatedAt ?? now
        })
    }
}

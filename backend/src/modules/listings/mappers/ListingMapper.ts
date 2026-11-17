import { Listing } from '../entities/Listing'
import { CATEGORY_INFO } from '../enums/ListingCategory'

const base = (listing: Listing) => {
    const { props } = listing
    return {
        id: props.id,
        slug: props.slug,
        title: props.title,
        category: props.category,
        categoryLabel: CATEGORY_INFO[props.category].label,
        categorySlug: CATEGORY_INFO[props.category].slug,
        type: props.type,
        price: props.price,
        city: props.city,
        state: props.state,
        neighborhood: props.neighborhood,
        bedrooms: props.bedrooms,
        suites: props.suites,
        bathrooms: props.bathrooms,
        parking: props.parking,
        area: props.area,
        cover: props.photos[0] ?? null,
        photoCount: props.photos.length,
        developer: props.developer,
        deliveryDate: props.deliveryDate,
        constructionProgress: props.constructionProgress,
        featured: props.featured
    }
}

export class ListingMapper {
    /** Cartão da lista (leve: só a capa) */
    static toCard(listing: Listing) {
        return base(listing)
    }

    /** Página do imóvel */
    static toDetail(listing: Listing) {
        const { props } = listing
        return {
            ...base(listing),
            address: props.address,
            description: props.description,
            features: props.features,
            photos: props.photos,
            updatedAt: props.updatedAt.toISOString()
        }
    }
}

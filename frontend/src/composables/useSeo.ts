import { SITE } from '@/config'

interface Seo {
    title: string
    description?: string
    /** Caminho canônico (ex.: /imovel/abc) */
    path?: string
    image?: string | null
    /** Dados estruturados (schema.org) da página */
    jsonLd?: Record<string, unknown> | null
}

const DEFAULT_TITLE = `${SITE.name} · Imóveis usados, na planta e em construção`

function meta(attr: 'name' | 'property', key: string, content: string) {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attr, key)
        document.head.appendChild(element)
    }
    element.setAttribute('content', content)
}

function link(rel: string, href: string) {
    let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (!element) {
        element = document.createElement('link')
        element.rel = rel
        document.head.appendChild(element)
    }
    element.href = href
}

/** Título, descrição, canonical, Open Graph e JSON-LD da página atual (SPA: atualizado a cada navegação) */
export function setSeo({ title, description, path, image, jsonLd }: Seo) {
    const fullTitle = title ? `${title} · ${SITE.name}` : DEFAULT_TITLE
    document.title = fullTitle
    meta('property', 'og:title', fullTitle)
    if (description) {
        meta('name', 'description', description)
        meta('property', 'og:description', description)
    }
    if (path !== undefined) {
        const url = `${SITE.url}${path}`
        link('canonical', url)
        meta('property', 'og:url', url)
    }
    if (image) meta('property', 'og:image', image.startsWith('http') ? image : `${SITE.url}${image}`)

    document.head.querySelector('script[data-jsonld]')?.remove()
    if (jsonLd) {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.dataset.jsonld = 'true'
        script.textContent = JSON.stringify(jsonLd)
        document.head.appendChild(script)
    }
}

import { computed, ref } from 'vue'

const KEY = 'habitse:favoritos'

function read(): string[] {
    try {
        const value = JSON.parse(localStorage.getItem(KEY) ?? '[]')
        return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
    } catch {
        return []
    }
}

// Estado único para o site todo (o coração do cartão e a aba Favoritos ficam sempre em sincronia)
const slugs = ref<string[]>(read())

function persist() {
    try {
        localStorage.setItem(KEY, JSON.stringify(slugs.value))
    } catch {
        // Navegação privada ou armazenamento cheio: os favoritos valem só nesta visita
    }
}

/** Imóveis favoritados neste aparelho (sem cadastro) */
export function useFavorites() {
    return {
        slugs,
        count: computed(() => slugs.value.length),
        has: (slug: string) => slugs.value.includes(slug),
        toggle(slug: string) {
            slugs.value = slugs.value.includes(slug) ? slugs.value.filter(item => item !== slug) : [slug, ...slugs.value]
            persist()
        }
    }
}

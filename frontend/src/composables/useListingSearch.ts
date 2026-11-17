import { onBeforeUnmount, ref } from 'vue'

import { ApiError, listingsApi, type ListParams } from '@/api/client'
import type { ListingCard } from '@/types/Listing'

const PER_PAGE = 12

/**
 * Lista paginada com "carregar mais" (rolagem infinita). Cada nova busca cancela a anterior,
 * então digitar/trocar filtros rápido nunca mostra o resultado de uma pesquisa velha.
 */
export function useListingSearch() {
    const items = ref<ListingCard[]>([])
    const total = ref<number | null>(null)
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref('')
    const hasMore = ref(false)

    let page = 1
    let params: ListParams = {}
    let controller: AbortController | null = null

    async function fetchPage(next: number) {
        controller?.abort()
        controller = new AbortController()
        const signal = controller.signal
        try {
            const result = await listingsApi.list({ ...params, page: next, perPage: PER_PAGE }, signal)
            if (signal.aborted) return
            items.value = next === 1 ? result.data : [...items.value, ...result.data]
            total.value = result.pagination.total
            hasMore.value = result.pagination.page < result.pagination.lastPage
            page = next
            error.value = ''
        } catch (e) {
            if ((e as Error).name === 'AbortError') return
            error.value = e instanceof ApiError ? e.message : 'Não foi possível carregar agora.'
        } finally {
            if (!signal.aborted) {
                loading.value = false
                loadingMore.value = false
            }
        }
    }

    /** Nova busca (primeira página) */
    function search(next: ListParams) {
        params = next
        loading.value = true
        if (items.value.length === 0) total.value = null
        return fetchPage(1)
    }

    function loadMore() {
        if (loading.value || loadingMore.value || !hasMore.value) return
        loadingMore.value = true
        return fetchPage(page + 1)
    }

    onBeforeUnmount(() => controller?.abort())

    return { items, total, loading, loadingMore, error, hasMore, search, loadMore }
}

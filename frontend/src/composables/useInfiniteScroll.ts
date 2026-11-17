import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Chama `onReach` quando o elemento sentinela chega perto do fim da tela (carrega antes de o usuário "bater" no fim) */
export function useInfiniteScroll(sentinel: Ref<HTMLElement | null>, onReach: () => void) {
    let observer: IntersectionObserver | null = null

    onMounted(() => {
        if (!sentinel.value || typeof IntersectionObserver === 'undefined') return
        observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) onReach()
        }, { rootMargin: '600px 0px' })
        observer.observe(sentinel.value)
    })

    onBeforeUnmount(() => observer?.disconnect())
}

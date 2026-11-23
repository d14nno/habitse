<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import { listingsApi } from '@/api/client'
import { useFavorites } from '@/composables/useFavorites'
import { setSeo } from '@/composables/useSeo'
import type { ListingCard as Card } from '@/types/Listing'
import AppIcon from '@/components/AppIcon.vue'
import CardSkeleton from '@/components/CardSkeleton.vue'
import ListingCard from '@/components/ListingCard.vue'

const favorites = useFavorites()
const items = ref<Card[]>([])
const loading = ref(true)
const error = ref('')

/** Os favoritos ficam no aparelho (só o código do imóvel); aqui buscamos os dados atuais de cada um */
async function load() {
    loading.value = true
    error.value = ''
    try {
        const results = await Promise.allSettled(favorites.slugs.value.map(slug => listingsApi.get(slug)))
        // Imóvel que saiu do ar (404) some da lista; falha de rede em todos vira aviso
        items.value = results.flatMap(result => (result.status === 'fulfilled' ? [result.value] : []))
        if (results.length && !items.value.length && results.every(result => result.status === 'rejected' && (result.reason as { status?: number }).status === 0)) {
            error.value = 'Sem conexão. Verifique sua internet e tente de novo.'
        }
    } finally {
        loading.value = false
    }
}

// Remover um favorito tira o cartão da tela na hora
watch(() => favorites.slugs.value.length, () => {
    items.value = items.value.filter(item => favorites.has(item.slug))
})

onMounted(() => {
    setSeo({ title: 'Meus favoritos', description: 'Os imóveis que você salvou.', path: '/favoritos' })
    load()
})
</script>

<template>
    <div class="container">
        <header class="head"><h1>Meus favoritos</h1><p class="muted">Salvos neste aparelho. Toque no coração de um imóvel para guardá-lo aqui.</p></header>

        <p v-if="error" class="notice" role="alert">{{ error }} <button type="button" class="retry" @click="load">Tentar de novo</button></p>
        <div v-if="loading && favorites.count.value" class="grid"><CardSkeleton v-for="n in Math.min(favorites.count.value, 6)" :key="n" /></div>
        <div v-else-if="items.length" class="grid"><ListingCard v-for="item in items" :key="item.id" :listing="item" /></div>
        <div v-else-if="!error" class="empty">
            <AppIcon name="heart" :size="36" />
            <h2>Nenhum favorito ainda</h2>
            <p>Explore os imóveis e salve os que você gostar.</p>
            <RouterLink to="/imoveis" class="btn primary">Explorar imóveis</RouterLink>
        </div>
    </div>
</template>

<style scoped>
.head { padding: 22px 0 16px; }
h1 { font-size: 2rem; }
.head p { margin-top: 4px; font-size: .94rem; }
.empty { display: grid; justify-items: center; gap: 8px; padding: 44px 16px; text-align: center; color: var(--ink-2); }
.empty h2 { color: var(--ink); }
.retry { margin-left: 8px; border: 0; background: none; text-decoration: underline; font-weight: 700; color: inherit; }
</style>

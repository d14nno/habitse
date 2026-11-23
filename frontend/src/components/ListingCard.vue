<script setup lang="ts">
import { computed } from 'vue'

import { useFavorites } from '@/composables/useFavorites'
import { categoryByKey } from '@/utils/categories'
import { formatDelivery, formatPrice, priceLead, summary } from '@/utils/format'
import type { ListingCard } from '@/types/Listing'
import AppIcon from './AppIcon.vue'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{ listing: ListingCard, eager?: boolean }>()

const favorites = useFavorites()
const favorite = computed(() => favorites.has(props.listing.slug))
const delivery = computed(() => formatDelivery(props.listing.deliveryDate))
const lead = computed(() => priceLead(props.listing.category, props.listing.price))
/** Situação do imóvel, sempre visível: usado, em construção, lançamento ou pronto */
const status = computed(() => {
    const base = categoryByKey(props.listing.category).status
    return props.listing.permuta ? `${base} · Permuta Bambuí` : base
})
</script>

<template>
    <article class="card">
        <div class="media">
            <RouterLink :to="`/imovel/${listing.slug}`" class="photo" :aria-label="`Ver ${listing.title}`">
                <img v-if="listing.cover" :src="listing.cover" :alt="listing.title" :loading="eager ? 'eager' : 'lazy'" decoding="async" width="640" height="480">
                <span v-else class="noimg">Sem foto</span>
            </RouterLink>
            <button type="button" class="fav" :class="{ on: favorite }" :aria-pressed="favorite" :aria-label="favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'" @click="favorites.toggle(listing.slug)">
                <AppIcon name="heart" :size="22" />
            </button>
        </div>

        <RouterLink :to="`/imovel/${listing.slug}`" class="body">
            <p class="tag">{{ status }}</p>
            <h3>{{ listing.title }}</h3>
            <p class="where">{{ listing.neighborhood }}, {{ listing.city }}</p>
            <p v-if="summary(listing)" class="facts">{{ summary(listing) }}</p>
            <p class="price"><small v-if="lead">{{ lead }}</small>{{ formatPrice(listing.price) }}</p>

            <template v-if="listing.category === 'under_construction' || listing.category === 'off_plan'">
                <ProgressBar v-if="listing.category === 'under_construction' && listing.constructionProgress !== null" :value="listing.constructionProgress" compact />
                <p v-if="delivery" class="meta">Entrega {{ delivery }}</p>
            </template>
        </RouterLink>
    </article>
</template>

<style scoped>
.card { position: relative; display: flex; flex-direction: column; content-visibility: auto; contain-intrinsic-size: 340px 400px; }
.media { position: relative; }
.photo { position: relative; display: block; aspect-ratio: 4 / 3; background: #d9d3c5; overflow: hidden; }
.photo img { width: 100%; height: 100%; object-fit: cover; }
.noimg { display: grid; place-items: center; height: 100%; color: var(--ink-3); }
.fav { position: absolute; right: 10px; top: 10px; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(245, 242, 235, .94); color: var(--brand); }
.fav.on { color: #9f2a1d; }
.fav.on :deep(path) { fill: currentColor; }
.body { display: block; padding: 18px 0 4px; }
h3 { margin-top: 8px; font-size: 1.45rem; line-height: 1.2; }
.where { margin-top: 3px; font-size: .88rem; color: var(--ink-3); }
.facts { margin-top: 12px; font-size: .94rem; color: var(--ink); }
.price { margin-top: 12px; font-family: var(--serif); font-size: 1.5rem; font-weight: 500; }
.price small { display: block; font-family: var(--font); font-size: .78rem; font-weight: 500; color: var(--ink-3); }
.meta { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .84rem; color: var(--ink-3); }
</style>

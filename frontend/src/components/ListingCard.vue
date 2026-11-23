<script setup lang="ts">
import { computed } from 'vue'

import { useFavorites } from '@/composables/useFavorites'
import { formatDelivery, formatPrice, summary } from '@/utils/format'
import { typeLabel } from '@/utils/categories'
import type { ListingCard } from '@/types/Listing'
import AppIcon from './AppIcon.vue'
import ProgressBar from './ProgressBar.vue'

const props = defineProps<{ listing: ListingCard, eager?: boolean }>()

const favorites = useFavorites()
const favorite = computed(() => favorites.has(props.listing.slug))
const delivery = computed(() => formatDelivery(props.listing.deliveryDate))
</script>

<template>
    <article class="card">
        <RouterLink :to="`/imovel/${listing.slug}`" class="photo" :aria-label="`Ver ${listing.title}`">
            <img v-if="listing.cover" :src="listing.cover" :alt="listing.title" :loading="eager ? 'eager' : 'lazy'" decoding="async" width="640" height="480">
            <span v-else class="noimg">Sem foto</span>
            <span class="badge" :class="listing.category">{{ listing.categoryLabel }}</span>
            <span v-if="listing.permuta" class="badge permuta">Permuta Bambuí</span>
            <span v-if="listing.photoCount > 1" class="count">{{ listing.photoCount }} fotos</span>
        </RouterLink>
        <button type="button" class="fav" :class="{ on: favorite }" :aria-pressed="favorite" :aria-label="favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'" @click="favorites.toggle(listing.slug)">
            <AppIcon name="heart" :size="22" />
        </button>

        <RouterLink :to="`/imovel/${listing.slug}`" class="body">
            <p class="price"><small v-if="listing.category !== 'used' && listing.price !== null">A partir de</small>{{ formatPrice(listing.price) }}</p>
            <h3>{{ listing.title }}</h3>
            <p class="where"><AppIcon name="pin" :size="15" /> {{ listing.neighborhood }}, {{ listing.city }}</p>
            <p class="facts">{{ typeLabel(listing.type) }}<template v-if="summary(listing)"> · {{ summary(listing) }}</template></p>

            <template v-if="listing.category !== 'used'">
                <ProgressBar v-if="listing.category === 'under_construction' && listing.constructionProgress !== null" :value="listing.constructionProgress" compact />
                <p v-if="delivery || listing.developer" class="meta">
                    <span v-if="delivery"><AppIcon name="calendar" :size="14" /> Entrega {{ delivery }}</span>
                    <span v-if="listing.developer">{{ listing.developer }}</span>
                </p>
            </template>
        </RouterLink>
    </article>
</template>

<style scoped>
.card { position: relative; background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; display: flex; flex-direction: column; content-visibility: auto; contain-intrinsic-size: 340px 380px; transition: transform .15s ease; }
.card:active { transform: scale(.992); }
.photo { position: relative; display: block; aspect-ratio: 4 / 3; background: #dfe8e5; }
.photo img { width: 100%; height: 100%; object-fit: cover; }
.noimg { display: grid; place-items: center; height: 100%; color: var(--ink-3); }
.badge { position: absolute; left: 10px; top: 10px; }
.count { position: absolute; left: 10px; bottom: 10px; padding: 3px 9px; border-radius: 999px; background: rgba(16, 32, 29, .72); color: #fff; font-size: .74rem; font-weight: 600; }
.fav { position: absolute; right: 8px; top: 8px; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .92); color: var(--ink-2); box-shadow: 0 2px 8px rgba(0, 0, 0, .15); transition: transform .15s ease; }
.fav:active { transform: scale(.88); }
.fav.on { color: #e11d48; }
.fav.on :deep(path) { fill: currentColor; }
.body { display: block; padding: 14px 16px 16px; }
.price { font-size: 1.3rem; font-weight: 800; letter-spacing: -.02em; }
.price small { display: block; font-size: .72rem; font-weight: 600; letter-spacing: 0; color: var(--ink-3); }
.badge.permuta { top: 42px; background: #10201d; color: #fff; }
h3 { margin-top: 2px; font-size: 1rem; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.where, .facts, .meta { margin-top: 6px; font-size: .9rem; color: var(--ink-2); display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.facts { color: var(--ink-3); }
.meta { gap: 6px 14px; margin-top: 8px; font-weight: 600; }
.meta span { display: inline-flex; align-items: center; gap: 5px; }
</style>

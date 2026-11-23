<script setup lang="ts">
import { computed, ref } from 'vue'

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

/** Fotos do cartão: a capa e mais algumas, que se passam com o dedo (celular) ou com as setas (computador) */
const photos = computed(() => (props.listing.gallery?.length ? props.listing.gallery : props.listing.cover ? [props.listing.cover] : []))
const scroller = ref<HTMLElement | null>(null)
const position = ref(0)

function onScroll() {
    const el = scroller.value
    if (el) position.value = Math.round(el.scrollLeft / el.clientWidth)
}

function go(step: number) {
    const el = scroller.value
    if (!el) return
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: (position.value + step) * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' })
}
</script>

<template>
    <article class="card">
        <div class="media">
            <div ref="scroller" class="photos" @scroll.passive="onScroll">
                <RouterLink v-for="(photo, i) in photos" :key="photo" :to="`/imovel/${listing.slug}`" class="photo" :aria-label="i === 0 ? `Ver ${listing.title}` : undefined" :aria-hidden="i === 0 ? undefined : true" :tabindex="i === 0 ? undefined : -1">
                    <img :src="photo" :alt="i === 0 ? listing.title : ''" :loading="eager && i === 0 ? 'eager' : 'lazy'" decoding="async" width="640" height="480">
                </RouterLink>
                <RouterLink v-if="!photos.length" :to="`/imovel/${listing.slug}`" class="photo" :aria-label="`Ver ${listing.title}`"><span class="noimg">Sem foto</span></RouterLink>
            </div>

            <template v-if="photos.length > 1">
                <button v-if="position > 0" type="button" class="arrow prev" aria-label="Foto anterior" @click="go(-1)"><AppIcon name="chevron" :size="20" /></button>
                <button v-if="position < photos.length - 1" type="button" class="arrow next" aria-label="Próxima foto" @click="go(1)"><AppIcon name="chevron" :size="20" /></button>
                <div class="dots" aria-hidden="true"><i v-for="(photo, i) in photos" :key="photo" :class="{ on: i === position }" /></div>
            </template>

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
.photos { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch; background: #d9d3c5; }
.photos::-webkit-scrollbar { display: none; }
.photo { position: relative; flex: none; width: 100%; aspect-ratio: 4 / 3; display: block; overflow: hidden; scroll-snap-align: start; scroll-snap-stop: always; }
.photo img { width: 100%; height: 100%; object-fit: cover; }
.noimg { display: grid; place-items: center; height: 100%; color: var(--ink-3); }
.fav { position: absolute; right: 10px; top: 10px; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(245, 242, 235, .94); color: var(--brand); }
.fav.on { color: #9f2a1d; }
.fav.on :deep(path) { fill: currentColor; }
.arrow { position: absolute; top: 50%; width: 44px; height: 44px; margin-top: -22px; display: none; place-items: center; border: 0; border-radius: 50%; background: rgba(245, 242, 235, .94); color: var(--brand); opacity: 0; transition: opacity .15s ease; }
.arrow.prev { left: 10px; transform: scaleX(-1); }
.arrow.next { right: 10px; }
.media:hover .arrow, .arrow:focus-visible { opacity: 1; }
.dots { position: absolute; left: 0; right: 0; bottom: 10px; display: flex; justify-content: center; gap: 5px; pointer-events: none; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(245, 242, 235, .6); }
.dots i.on { background: var(--bg); }
.body { display: block; padding: 18px 0 4px; }
h3 { margin-top: 8px; font-size: 1.45rem; line-height: 1.2; }
.where { margin-top: 3px; font-size: .88rem; color: var(--ink-3); }
.facts { margin-top: 12px; font-size: .94rem; color: var(--ink); }
.price { margin-top: 12px; font-family: var(--serif); font-size: 1.5rem; font-weight: 500; }
.price small { display: block; font-family: var(--font); font-size: .78rem; font-weight: 500; color: var(--ink-3); }
.meta { margin-top: 8px; font-size: .84rem; color: var(--ink-3); }
@media (hover: hover) and (min-width: 900px) { .arrow { display: grid; } }
</style>

<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { listingsApi } from '@/api/client'
import { activeFilterCount, filtersFromQuery, filtersToQuery } from '@/composables/filters'
import { setSeo } from '@/composables/useSeo'
import { CATEGORIES, categoryByKey, categoryBySlug } from '@/utils/categories'
import { formatDelivery, formatPrice, priceLead, summary } from '@/utils/format'
import { APPROX_RADIUS, buildPoints, loadPlaces, pinLabel, type MapPoint } from '@/utils/mapPoints'
import type { Facets, Filters } from '@/types/Listing'
import AppIcon from '@/components/AppIcon.vue'
import FilterSheet from '@/components/FilterSheet.vue'

const route = useRoute()
const router = useRouter()

const el = ref<HTMLElement | null>(null)
const facets = ref<Facets | null>(null)
const sheetOpen = ref(false)
const selected = ref<MapPoint | null>(null)
const loading = ref(true)
const error = ref('')
const total = ref(0)
const missing = ref(0)

const filters = computed<Filters>(() => filtersFromQuery(route.query))
const category = computed(() => categoryBySlug(String(route.query.categoria ?? '')))
const activeCount = computed(() => activeFilterCount(filters.value))

let map: L.Map | null = null
let layer: L.MarkerClusterGroup | null = null
let circles: L.LayerGroup | null = null
let run = 0

/** A URL guarda categoria e filtros: compartilhar ou voltar reabre o mesmo mapa */
function setQuery(next: Filters, slug: string | undefined) {
    router.replace({ query: { ...filtersToQuery(next), ...(slug ? { categoria: slug } : {}) } })
}

function draw(points: MapPoint[]) {
    if (!map || !layer) return
    layer.clearLayers()
    circles?.clearLayers()

    for (const point of points) {
        const latlng: L.LatLngExpression = [point.lat, point.lng]
        if (point.approx) L.circle(latlng, { radius: APPROX_RADIUS, color: '#173d36', weight: 1, fillColor: '#173d36', fillOpacity: 0.1, interactive: false }).addTo(circles as L.LayerGroup)

        const icon = L.divIcon({
            className: 'hb-pin-wrap',
            html: `<span class="hb-pin${point.approx ? ' approx' : ''}">${pinLabel(point.listing.price)}</span>`,
            iconSize: [0, 0]
        })
        L.marker(latlng, { icon, keyboard: true, title: point.listing.title, riseOnHover: true })
            .on('click', () => { selected.value = point })
            .addTo(layer)
    }

    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 14)
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points.map(point => [point.lat, point.lng] as [number, number])), { padding: [48, 48], maxZoom: 15 })
}

async function load() {
    const current = ++run
    loading.value = true
    error.value = ''
    selected.value = null

    try {
        const [result, known] = await Promise.all([
            listingsApi.list({ ...filters.value, category: category.value?.key, perPage: 50 }),
            loadPlaces()
        ])
        if (current !== run) return

        const built = buildPoints(result.data, known)
        total.value = result.pagination.total
        missing.value = built.missing
        draw(built.points)
    } catch {
        if (current === run) error.value = 'Não foi possível carregar o mapa agora.'
    } finally {
        if (current === run) loading.value = false
    }
}

async function loadFacets() {
    try {
        facets.value = await listingsApi.facets(category.value?.key)
    } catch {
        facets.value = null
    }
}

onMounted(() => {
    if (!el.value) return
    map = L.map(el.value, { zoomControl: false, attributionControl: true }).setView([-16.69, -49.27], 12)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map)
    circles = L.layerGroup().addTo(map)
    layer = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 44,
        iconCreateFunction: cluster => L.divIcon({ html: `<span>${cluster.getChildCount()}</span>`, className: 'hb-cluster', iconSize: [40, 40] })
    }).addTo(map)
    map.on('click', () => { selected.value = null })
    load()
})

onBeforeUnmount(() => {
    run++
    map?.remove()
    map = null
})

watch(() => route.query, () => { if (route.name === 'map') load() })
watch(() => route.query.categoria, () => { facets.value = null; loadFacets() }, { immediate: true })

setSeo({
    title: 'Mapa de imóveis',
    description: 'Veja no mapa onde ficam os imóveis da Habitse em Goiânia e região, com valores, fotos e contato direto com um consultor.',
    path: '/mapa'
})

const status = computed(() => (selected.value ? categoryByKey(selected.value.listing.category).status : ''))
const lead = computed(() => (selected.value ? priceLead(selected.value.listing.category, selected.value.listing.price) : null))
const delivery = computed(() => (selected.value ? formatDelivery(selected.value.listing.deliveryDate) : null))
const facts = computed(() => (selected.value ? [summary(selected.value.listing), delivery.value ? `Entrega ${delivery.value}` : ''].filter(Boolean).join(' · ') : ''))
</script>

<template>
    <div class="mapview">
        <div ref="el" class="map" role="application" aria-label="Mapa dos imóveis" />

        <div class="bar">
            <div class="chips" role="group" aria-label="Categoria">
                <button type="button" class="chip" :class="{ on: !category }" @click="setQuery(filters, undefined)">Todos</button>
                <button v-for="item in CATEGORIES" :key="item.key" type="button" class="chip" :class="{ on: category?.key === item.key }" @click="setQuery(filters, item.slug)">{{ item.short }}</button>
            </div>
            <button type="button" class="btn filter" :class="{ on: activeCount > 0 }" @click="sheetOpen = true">
                <AppIcon name="filter" :size="20" /> Filtros<span v-if="activeCount" class="n">{{ activeCount }}</span>
            </button>
        </div>

        <p class="count" aria-live="polite">
            <template v-if="loading">Carregando…</template>
            <template v-else-if="error">{{ error }}</template>
            <template v-else>
                {{ total === 1 ? '1 imóvel' : `${total} imóveis` }}<template v-if="missing"> · {{ missing }} sem localização no mapa</template>
                <RouterLink to="/imoveis" class="list">Ver em lista</RouterLink>
            </template>
        </p>

        <Transition name="up">
            <article v-if="selected" class="card" aria-live="polite">
                <button type="button" class="x" aria-label="Fechar" @click="selected = null"><AppIcon name="close" :size="18" /></button>
                <RouterLink :to="`/imovel/${selected.listing.slug}`" class="photo" :aria-label="`Ver ${selected.listing.title}`">
                    <img v-if="selected.listing.cover" :src="selected.listing.cover" :alt="selected.listing.title" width="160" height="120">
                </RouterLink>
                <div class="info">
                    <p class="status">{{ status }}</p>
                    <h2><RouterLink :to="`/imovel/${selected.listing.slug}`">{{ selected.listing.title }}</RouterLink></h2>
                    <p class="where">{{ selected.listing.neighborhood }}, {{ selected.listing.city }}<template v-if="selected.approx"> · localização aproximada</template></p>
                    <p class="facts">{{ facts }}</p>
                    <p class="price"><small v-if="lead">{{ lead }}</small> {{ formatPrice(selected.listing.price) }}</p>
                </div>
            </article>
        </Transition>

        <FilterSheet :open="sheetOpen" :filters="filters" :facets="facets" :total="total" @close="sheetOpen = false" @apply="next => { sheetOpen = false; setQuery(next, category?.slug) }" />
    </div>
</template>

<style scoped>
.mapview { position: relative; height: calc(100dvh - var(--header-h) - var(--nav-h) - var(--safe-bottom)); min-height: 420px; isolation: isolate; }
.map { position: absolute; inset: 0; background: var(--brand-soft); }
.bar { position: absolute; z-index: 500; top: 10px; left: 10px; right: 10px; display: flex; gap: 8px; align-items: flex-start; pointer-events: none; }
.bar > * { pointer-events: auto; }
.chips { flex: 1; min-width: 0; margin: 0; padding: 2px 0 6px; }
.chips::-webkit-scrollbar { display: none; }
.chips .chip { flex: none; box-shadow: 0 1px 4px rgba(0, 0, 0, .18); }
.filter { flex: none; position: relative; min-height: 40px; padding: 0 14px; background: var(--card); box-shadow: 0 1px 4px rgba(0, 0, 0, .18); }
.filter.on { background: var(--brand-soft); }
.n { min-width: 20px; height: 20px; padding: 0 5px; border-radius: 99px; background: var(--brand); color: var(--bg); font-size: .72rem; display: grid; place-items: center; }
.count { position: absolute; z-index: 500; left: 10px; top: 58px; margin: 0; padding: 6px 12px; border-radius: 99px; background: var(--card); box-shadow: 0 1px 4px rgba(0, 0, 0, .18); font-size: .82rem; font-weight: 600; color: var(--ink-2); }
.list { margin-left: 8px; color: var(--brand); text-decoration: underline; }
.card { position: absolute; z-index: 600; left: 10px; right: 10px; bottom: 12px; display: grid; grid-template-columns: 112px 1fr; gap: 12px; padding: 10px; border-radius: var(--radius-sm); background: var(--card); box-shadow: 0 6px 24px rgba(0, 0, 0, .25); max-width: 520px; }
.x { position: absolute; top: 4px; right: 4px; width: 32px; height: 32px; display: grid; place-items: center; border: 0; background: transparent; color: var(--ink-3); }
.photo { display: block; border-radius: 6px; overflow: hidden; background: var(--brand-soft); aspect-ratio: 4 / 3; }
.photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.info { min-width: 0; padding-right: 22px; }
.status { margin: 0; font-size: .68rem; letter-spacing: .12em; text-transform: uppercase; font-weight: 600; color: var(--ink-3); }
.info h2 { margin: 2px 0 0; font-size: 1.05rem; line-height: 1.2; }
.info h2 a { color: var(--ink); }
.where, .facts { margin: 3px 0 0; font-size: .8rem; color: var(--ink-3); }
.price { margin: 6px 0 0; font-weight: 700; color: var(--brand); }
.price small { font-weight: 500; font-size: .74rem; color: var(--ink-3); }
.up-enter-active, .up-leave-active { transition: transform .18s ease, opacity .18s ease; }
.up-enter-from, .up-leave-to { transform: translateY(16px); opacity: 0; }
@media (max-width: 899px) { .mapview :deep(.leaflet-control-zoom) { display: none; } }
@media (min-width: 900px) {
    .mapview { height: calc(100dvh - var(--header-h)); }
    .card { left: 16px; bottom: 24px; }
    .bar { left: 16px; right: 16px; }
    .count { left: 16px; }
}
@media (prefers-reduced-motion: reduce) { .up-enter-active, .up-leave-active { transition: none; } }
</style>

<style>
.hb-pin-wrap { overflow: visible; }
.hb-pin { position: absolute; transform: translate(-50%, -100%); display: block; padding: 5px 10px; border-radius: 99px; background: #173d36; color: #f5f2eb; font: 700 .8rem/1 'Public Sans', system-ui, sans-serif; white-space: nowrap; border: 2px solid #f5f2eb; box-shadow: 0 2px 6px rgba(0, 0, 0, .35); }
.hb-pin::after { content: ''; position: absolute; left: 50%; bottom: -7px; width: 8px; height: 8px; background: #173d36; border-right: 2px solid #f5f2eb; border-bottom: 2px solid #f5f2eb; transform: translateX(-50%) rotate(45deg); }
.hb-pin.approx { background: #f5f2eb; color: #173d36; border-color: #173d36; }
.hb-pin.approx::after { background: #f5f2eb; border-color: #173d36; }
.leaflet-container { font-family: inherit; }
.hb-cluster span { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; background: #173d36; color: #f5f2eb; font: 700 .95rem/1 'Public Sans', system-ui, sans-serif; border: 3px solid #c4b69e; box-shadow: 0 2px 8px rgba(0, 0, 0, .35); }
</style>

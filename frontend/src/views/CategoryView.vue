<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { listingsApi } from '@/api/client'
import { activeFilterCount, filtersFromQuery, filtersToQuery } from '@/composables/filters'
import { setSeo } from '@/composables/useSeo'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useListingSearch } from '@/composables/useListingSearch'
import { ALL_SLUG, categoryBySlug, typeLabel } from '@/utils/categories'
import type { Facets, Filters, Sort } from '@/types/Listing'
import AppIcon from '@/components/AppIcon.vue'
import CardSkeleton from '@/components/CardSkeleton.vue'
import FilterSheet from '@/components/FilterSheet.vue'
import ListingCard from '@/components/ListingCard.vue'
import NoResults from '@/components/NoResults.vue'

const route = useRoute()
const router = useRouter()
const search = useListingSearch()

/** `undefined` = todos os imóveis (/imoveis) */
const category = computed(() => (route.params.category ? categoryBySlug(String(route.params.category)) : undefined))
const title = computed(() => category.value?.label ?? 'Todos os imóveis')
const description = computed(() => category.value?.description ?? 'Prontos para morar, lançamentos, obras em andamento e oportunidades de mercado, com a situação de cada imóvel sempre informada.')
const filters = computed<Filters>(() => filtersFromQuery(route.query))
const activeCount = computed(() => activeFilterCount(filters.value))

const facets = ref<Facets | null>(null)
const sheetOpen = ref(false)
const sentinel = ref<HTMLElement | null>(null)
const searchText = ref(filters.value.q ?? '')
let searchTimer: ReturnType<typeof setTimeout> | undefined

const SORT_LABELS: Record<Sort, string> = { recent: 'Mais recentes', price_asc: 'Menor valor', price_desc: 'Maior valor', area_desc: 'Maior área' }

/** Atualiza a URL (a busca roda a partir dela, então voltar/compartilhar funciona) */
function setFilters(next: Filters) {
    router.replace({ query: filtersToQuery(next) })
}

const onSearchInput = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => setFilters({ ...filters.value, q: searchText.value.trim() || undefined }), 350)
}

function removeFilter(key: keyof Filters) {
    const next = { ...filters.value, [key]: undefined }
    if (key === 'city') next.neighborhood = undefined
    setFilters(next)
}

const money = (value: number) => `R$ ${value.toLocaleString('pt-BR')}`

/** Chips dos filtros ativos (um toque remove) */
const activeChips = computed(() => {
    const f = filters.value
    const chips: { key: keyof Filters, label: string }[] = []
    if (f.type) chips.push({ key: 'type', label: typeLabel(f.type) })
    if (f.city) chips.push({ key: 'city', label: f.city })
    if (f.neighborhood) chips.push({ key: 'neighborhood', label: f.neighborhood })
    if (f.minArea !== undefined) chips.push({ key: 'minArea', label: `${f.minArea} m² ou mais` })
    if (f.suites !== undefined) chips.push({ key: 'suites', label: `${f.suites}+ suítes` })
    if (f.bedrooms !== undefined) chips.push({ key: 'bedrooms', label: `${f.bedrooms}+ quartos` })
    if (f.parking !== undefined) chips.push({ key: 'parking', label: `${f.parking}+ vagas` })
    if (f.deliveryUntil !== undefined) chips.push({ key: 'deliveryUntil', label: `Entrega até ${f.deliveryUntil}` })
    if (f.feature) chips.push({ key: 'feature', label: f.feature })
    if (f.minPrice !== undefined) chips.push({ key: 'minPrice', label: `a partir de ${money(f.minPrice)}` })
    if (f.maxPrice !== undefined) chips.push({ key: 'maxPrice', label: `até ${money(f.maxPrice)}` })
    return chips
})

/** O que a pessoa procurava, para o consultor já receber o contexto no pedido de busca personalizada */
const topic = computed(() => [category.value?.label, ...activeChips.value.map(chip => chip.label), filters.value.q ? `"${filters.value.q}"` : ''].filter(Boolean).join(', '))

async function loadFacets() {
    try {
        facets.value = await listingsApi.facets(category.value?.key)
    } catch {
        facets.value = null
    }
}

// Troca de categoria ou de filtros → nova busca (a URL é a fonte da verdade)
watch(() => [route.params.category, route.query], () => {
    if (route.name !== 'category' && route.name !== 'all') return
    searchText.value = filters.value.q ?? ''
    search.search({ ...filters.value, category: category.value?.key })
    setSeo({
        title: category.value ? title.value : 'Imóveis à venda',
        description: `${description.value} Veja fotos, valores e fale com um consultor no WhatsApp.`,
        path: `/${category.value?.slug ?? ALL_SLUG}`
    })
}, { immediate: true, deep: true })

watch(() => route.params.category, () => { facets.value = null; loadFacets() }, { immediate: true })

useInfiniteScroll(sentinel, () => search.loadMore())
</script>

<template>
    <div class="container">
        <header class="head">
            <h1>{{ title }}</h1>
        </header>

        <div class="tools">
            <label class="find">
                <AppIcon name="search" :size="20" />
                <input v-model="searchText" type="search" inputmode="search" enterkeyhint="search" placeholder="Buscar por bairro, cidade ou nome" aria-label="Buscar nesta lista" @input="onSearchInput">
            </label>
            <button type="button" class="btn filter" :class="{ on: activeCount > 0 }" @click="sheetOpen = true">
                <AppIcon name="filter" :size="20" /> Filtros<span v-if="activeCount" class="n">{{ activeCount }}</span>
            </button>
        </div>

        <div class="chips" role="group" aria-label="Ordenar por">
            <button v-for="(label, key) in SORT_LABELS" :key="key" type="button" class="chip" :class="{ on: (filters.sort ?? 'recent') === key }" @click="setFilters({ ...filters, sort: key as Sort })">{{ label }}</button>
        </div>

        <div v-if="activeChips.length" class="chips active" aria-label="Filtros ativos">
            <button v-for="chip in activeChips" :key="chip.key" type="button" class="chip on" :aria-label="`Remover filtro ${chip.label}`" @click="removeFilter(chip.key)">{{ chip.label }} <AppIcon name="close" :size="14" /></button>
        </div>

        <p class="total" aria-live="polite">
            <template v-if="search.total.value !== null">{{ search.total.value === 1 ? '1 imóvel' : `${search.total.value} imóveis` }}</template>
            <template v-else>&nbsp;</template>
        </p>

        <p v-if="search.error.value" class="notice" role="alert">{{ search.error.value }} <button type="button" class="retry" @click="search.search({ ...filters, category: category?.key })">Tentar de novo</button></p>

        <div v-if="search.loading.value && !search.items.value.length" class="grid"><CardSkeleton v-for="n in 6" :key="n" /></div>

        <div v-else-if="search.items.value.length" class="grid">
            <ListingCard v-for="(item, i) in search.items.value" :key="item.id" :listing="item" :eager="i < 2" />
        </div>

        <NoResults
            v-else-if="!search.error.value"
            :can-clear="activeCount > 0 || !!filters.q"
            :topic="topic"
            :title="activeCount || filters.q ? undefined : 'Nenhum imóvel nesta lista no momento.'"
            @clear="setFilters({})"
        />

        <div v-if="search.loadingMore.value" class="grid more"><CardSkeleton v-for="n in 3" :key="n" /></div>
        <div ref="sentinel" class="sentinel" aria-hidden="true" />

        <FilterSheet :open="sheetOpen" :filters="filters" :facets="facets" :total="search.total.value" @close="sheetOpen = false" @apply="next => { sheetOpen = false; setFilters(next) }" />
    </div>
</template>

<style scoped>
.head { padding: 28px 0 16px; }
.head h1 { font-size: clamp(2rem, 6vw, 3.2rem); line-height: 1.06; }
.tools { position: sticky; top: var(--header-h); z-index: 20; display: flex; gap: 8px; margin: 0 -16px; padding: 10px 16px; background: rgba(245, 242, 235, .96); backdrop-filter: blur(8px); }
.find { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 12px; border: 1px solid #cfc9bb; border-radius: var(--radius-sm); background: var(--card); color: var(--ink-3); }
.find input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 1rem; color: var(--ink); }
.filter { position: relative; padding: 0 16px; }
.filter.on { background: var(--brand-soft); }
.n { min-width: 20px; height: 20px; padding: 0 5px; border-radius: 99px; background: var(--brand); color: var(--bg); font-size: .72rem; display: grid; place-items: center; }
.chips { margin-top: 2px; }
.chips.active { margin-top: 4px; }
.total { margin: 14px 0 18px; font-size: .9rem; font-weight: 600; color: var(--ink-3); min-height: 1.3em; }
.grid { gap: 40px 32px; }
.more { margin-top: 16px; }
.sentinel { height: 1px; }
.retry { margin-left: 8px; border: 0; background: none; text-decoration: underline; font-weight: 700; color: inherit; }
@media (min-width: 900px) { .tools { margin: 0; padding-left: 0; padding-right: 0; } }
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { listingsApi } from '@/api/client'
import { activeFilterCount, filtersFromQuery, filtersToQuery } from '@/composables/filters'
import { setSeo } from '@/composables/useSeo'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useListingSearch } from '@/composables/useListingSearch'
import { categoryBySlug, typeLabel } from '@/utils/categories'
import type { Facets, Filters, Sort } from '@/types/Listing'
import AppIcon from '@/components/AppIcon.vue'
import CardSkeleton from '@/components/CardSkeleton.vue'
import FilterSheet from '@/components/FilterSheet.vue'
import ListingCard from '@/components/ListingCard.vue'

const route = useRoute()
const router = useRouter()
const search = useListingSearch()

const category = computed(() => categoryBySlug(String(route.params.category))!)
const filters = computed<Filters>(() => filtersFromQuery(route.query))
const activeCount = computed(() => activeFilterCount(filters.value))

const facets = ref<Facets | null>(null)
const sheetOpen = ref(false)
const sentinel = ref<HTMLElement | null>(null)
const searchText = ref(filters.value.q ?? '')
let searchTimer: ReturnType<typeof setTimeout> | undefined

const SORT_LABELS: Record<Sort, string> = { recent: 'Mais recentes', price_asc: 'Menor preço', price_desc: 'Maior preço', area_desc: 'Maior área' }

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

/** Chips dos filtros ativos (um toque remove) */
const activeChips = computed(() => {
    const f = filters.value
    const chips: { key: keyof Filters, label: string }[] = []
    if (f.type) chips.push({ key: 'type', label: typeLabel(f.type) })
    if (f.city) chips.push({ key: 'city', label: f.city })
    if (f.neighborhood) chips.push({ key: 'neighborhood', label: f.neighborhood })
    if (f.bedrooms !== undefined) chips.push({ key: 'bedrooms', label: `${f.bedrooms}+ quartos` })
    if (f.parking !== undefined) chips.push({ key: 'parking', label: `${f.parking}+ vagas` })
    if (f.minPrice !== undefined) chips.push({ key: 'minPrice', label: `a partir de R$ ${f.minPrice.toLocaleString('pt-BR')}` })
    if (f.maxPrice !== undefined) chips.push({ key: 'maxPrice', label: `até R$ ${f.maxPrice.toLocaleString('pt-BR')}` })
    return chips
})

async function loadFacets() {
    try {
        facets.value = await listingsApi.facets(category.value.key)
    } catch {
        facets.value = null
    }
}

// Troca de categoria ou de filtros → nova busca (a URL é a fonte da verdade)
watch(() => [route.params.category, route.query], () => {
    if (route.name !== 'category') return
    searchText.value = filters.value.q ?? ''
    search.search({ ...filters.value, category: category.value.key })
    setSeo({
        title: `${category.value.label} à venda`,
        description: `${category.value.description} Veja fotos, valores e fale no WhatsApp.`,
        path: `/${category.value.slug}`
    })
}, { immediate: true, deep: true })

watch(() => route.params.category, () => { facets.value = null; loadFacets() }, { immediate: true })

useInfiniteScroll(sentinel, () => search.loadMore())
</script>

<template>
    <div class="container">
        <header class="head" :style="{ '--c': category.color }">
            <h1>{{ category.label }}</h1>
            <p>{{ category.description }}</p>
        </header>

        <div class="tools">
            <label class="find">
                <AppIcon name="search" :size="20" />
                <input v-model="searchText" type="search" inputmode="search" enterkeyhint="search" placeholder="Buscar por bairro, cidade ou nome" aria-label="Buscar nesta categoria" @input="onSearchInput">
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

        <p v-if="search.error.value" class="notice" role="alert">{{ search.error.value }} <button type="button" class="retry" @click="search.search({ ...filters, category: category.key })">Tentar de novo</button></p>

        <div v-if="search.loading.value && !search.items.value.length" class="grid"><CardSkeleton v-for="n in 6" :key="n" /></div>

        <div v-else-if="search.items.value.length" class="grid">
            <ListingCard v-for="(item, i) in search.items.value" :key="item.id" :listing="item" :eager="i < 2" />
        </div>

        <div v-else-if="!search.error.value" class="empty">
            <AppIcon name="search" :size="34" />
            <h2>Nenhum imóvel encontrado</h2>
            <p>Tente remover algum filtro ou buscar por outro bairro.</p>
            <button v-if="activeCount || filters.q" type="button" class="btn primary" @click="setFilters({})">Limpar filtros</button>
        </div>

        <div v-if="search.loadingMore.value" class="grid more"><CardSkeleton v-for="n in 3" :key="n" /></div>
        <div ref="sentinel" class="sentinel" aria-hidden="true" />
        <p v-if="!search.hasMore.value && search.items.value.length > 6" class="end muted">Você viu todos os imóveis desta lista.</p>

        <FilterSheet :open="sheetOpen" :filters="filters" :facets="facets" :total="search.total.value" @close="sheetOpen = false" @apply="next => { sheetOpen = false; setFilters(next) }" />
    </div>
</template>

<style scoped>
.head { margin: 0 -16px; padding: 22px 16px 18px; background: linear-gradient(135deg, var(--c), color-mix(in srgb, var(--c) 70%, black)); color: #fff; }
.head h1 { font-size: 1.6rem; letter-spacing: -.02em; }
.head p { margin-top: 6px; max-width: 52ch; color: rgba(255, 255, 255, .88); font-size: .95rem; }
.tools { position: sticky; top: var(--header-h); z-index: 20; display: flex; gap: 8px; margin: 0 -16px; padding: 10px 16px; background: rgba(246, 248, 247, .94); backdrop-filter: blur(8px); }
.find { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 12px; border: 1px solid var(--line); border-radius: 12px; background: #fff; color: var(--ink-3); }
.find input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 1rem; color: var(--ink); }
.filter { position: relative; padding: 0 14px; }
.filter.on { border-color: var(--brand); color: var(--brand); }
.n { min-width: 20px; height: 20px; padding: 0 5px; border-radius: 99px; background: var(--brand); color: #fff; font-size: .72rem; display: grid; place-items: center; }
.chips { margin-top: 2px; }
.chips.active { margin-top: 4px; }
.total { margin: 10px 0 12px; font-size: .9rem; font-weight: 600; color: var(--ink-2); min-height: 1.3em; }
.empty { display: grid; justify-items: center; gap: 8px; padding: 40px 16px; text-align: center; color: var(--ink-2); }
.empty h2 { color: var(--ink); font-size: 1.15rem; }
.more { margin-top: 16px; }
.sentinel { height: 1px; }
.end { margin: 24px 0 4px; text-align: center; font-size: .9rem; }
.retry { margin-left: 8px; border: 0; background: none; text-decoration: underline; font-weight: 700; color: inherit; }
@media (min-width: 900px) { .head { margin: 0; border-radius: 0 0 var(--radius) var(--radius); padding: 30px 28px; } .tools { margin: 0; padding-left: 0; padding-right: 0; } }
</style>

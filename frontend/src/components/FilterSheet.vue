<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { formatPriceShort } from '@/utils/format'
import { typeLabel } from '@/utils/categories'
import type { Facets, Filters } from '@/types/Listing'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ open: boolean, filters: Filters, facets: Facets | null, total?: number | null }>()
const emit = defineEmits<{ close: [], apply: [filters: Filters] }>()

// Rascunho: só vale quando a pessoa toca em "Ver imóveis"
const draft = ref<Filters>({})
const sheet = ref<HTMLElement | null>(null)

watch(() => props.open, async open => {
    document.body.classList.toggle('locked', open)
    if (open) {
        draft.value = { ...props.filters }
        await nextTick()
        sheet.value?.focus()
    }
})
onBeforeUnmount(() => document.body.classList.remove('locked'))

const PRICE_STEPS = [150_000, 250_000, 350_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_500_000]
const priceOptions = computed(() => {
    const { min, max } = props.facets?.price ?? { min: null, max: null }
    const steps = PRICE_STEPS.filter(step => (min === null || step >= min * 0.6) && (max === null || step <= max * 1.4))
    return steps.length ? steps : PRICE_STEPS
})

const neighborhoods = computed(() => (props.facets?.neighborhoods ?? []).filter(item => !draft.value.city || item.city === draft.value.city))

function pick<K extends keyof Filters>(key: K, value: Filters[K]) {
    draft.value = { ...draft.value, [key]: draft.value[key] === value ? undefined : value }
}

function setCity(city: string) {
    // Trocar a cidade limpa o bairro (que pode não existir nela)
    draft.value = { ...draft.value, city: city || undefined, neighborhood: undefined }
}

const clear = () => { draft.value = { sort: props.filters.sort, q: props.filters.q } }
const apply = () => emit('apply', { ...draft.value })
</script>

<template>
    <Teleport to="body">
        <Transition name="sheet">
            <div v-if="open" class="overlay" @click.self="emit('close')" @keydown.esc="emit('close')">
                <section ref="sheet" class="sheet" role="dialog" aria-modal="true" aria-label="Filtros" tabindex="-1">
                    <header>
                        <h2>Filtros</h2>
                        <button type="button" class="x" aria-label="Fechar" @click="emit('close')"><AppIcon name="close" /></button>
                    </header>

                    <div class="content">
                        <fieldset v-if="facets?.types.length">
                            <legend>Tipo de imóvel</legend>
                            <div class="wrap">
                                <button v-for="item in facets.types" :key="item.type" type="button" class="chip" :class="{ on: draft.type === item.type }" @click="pick('type', item.type)">{{ typeLabel(item.type) }}</button>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>Localização</legend>
                            <div class="two">
                                <label>Cidade
                                    <select :value="draft.city ?? ''" @change="setCity(($event.target as HTMLSelectElement).value)">
                                        <option value="">Todas</option>
                                        <option v-for="item in facets?.cities ?? []" :key="item.city" :value="item.city">{{ item.city }} ({{ item.total }})</option>
                                    </select>
                                </label>
                                <label>Bairro
                                    <select :value="draft.neighborhood ?? ''" @change="draft = { ...draft, neighborhood: ($event.target as HTMLSelectElement).value || undefined }">
                                        <option value="">Todos</option>
                                        <option v-for="item in neighborhoods" :key="`${item.city}-${item.neighborhood}`" :value="item.neighborhood">{{ item.neighborhood }} ({{ item.total }})</option>
                                    </select>
                                </label>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>Valor</legend>
                            <div class="two">
                                <label>De
                                    <select :value="draft.minPrice ?? ''" @change="draft = { ...draft, minPrice: Number(($event.target as HTMLSelectElement).value) || undefined }">
                                        <option value="">Sem mínimo</option>
                                        <option v-for="step in priceOptions" :key="step" :value="step">{{ formatPriceShort(step) }}</option>
                                    </select>
                                </label>
                                <label>Até
                                    <select :value="draft.maxPrice ?? ''" @change="draft = { ...draft, maxPrice: Number(($event.target as HTMLSelectElement).value) || undefined }">
                                        <option value="">Sem máximo</option>
                                        <option v-for="step in priceOptions" :key="step" :value="step">{{ formatPriceShort(step) }}</option>
                                    </select>
                                </label>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>Quartos</legend>
                            <div class="wrap">
                                <button v-for="n in [1, 2, 3, 4]" :key="n" type="button" class="chip" :class="{ on: draft.bedrooms === n }" @click="pick('bedrooms', n)">{{ n }}+</button>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>Vagas de garagem</legend>
                            <div class="wrap">
                                <button v-for="n in [1, 2, 3]" :key="n" type="button" class="chip" :class="{ on: draft.parking === n }" @click="pick('parking', n)">{{ n }}+</button>
                            </div>
                        </fieldset>
                    </div>

                    <footer>
                        <button type="button" class="btn ghost" @click="clear">Limpar</button>
                        <button type="button" class="btn primary grow" @click="apply">Ver imóveis<template v-if="total !== null && total !== undefined"> ({{ total }})</template></button>
                    </footer>
                </section>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; z-index: 60; background: rgba(8, 20, 18, .5); display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: 100%; max-width: 560px; max-height: 92dvh; display: flex; flex-direction: column; background: #fff; border-radius: 22px 22px 0 0; outline: none; }
header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px 20px; }
h2 { font-size: 1.15rem; }
.x { width: 44px; height: 44px; display: grid; place-items: center; border: 0; background: transparent; border-radius: 50%; }
.content { overflow-y: auto; padding: 0 20px 12px; display: grid; gap: 18px; overscroll-behavior: contain; }
fieldset { border: 0; padding: 0; margin: 0; }
legend { padding: 0; margin-bottom: 8px; font-weight: 700; }
.wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
label { display: grid; gap: 4px; font-size: .82rem; font-weight: 600; color: var(--ink-3); }
select { min-height: 46px; padding: 0 10px; border: 1px solid var(--line); border-radius: 12px; background: #fff; font-size: 1rem; color: var(--ink); }
footer { display: flex; gap: 10px; padding: 12px 20px calc(14px + var(--safe-bottom)); border-top: 1px solid var(--line); }
.grow { flex: 1; }
.sheet-enter-active, .sheet-leave-active { transition: opacity .2s ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform .25s cubic-bezier(.2, .8, .2, 1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
@media (min-width: 700px) { .overlay { align-items: center; } .sheet { border-radius: 22px; } }
</style>

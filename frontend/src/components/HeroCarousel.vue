<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { HeroSlide } from '@/api/staticCatalog'

/**
 * Fundo da abertura: começa na foto fixa e passa, em fade lento, pelas fachadas e áreas de lazer dos empreendimentos.
 * Pausa com o mouse ou o toque em cima, tem botão de pausa e não anda sozinho para quem pediu "reduzir movimento".
 */
const props = defineProps<{ slides: HeroSlide[], first: string, firstAlt: string }>()

const INTERVAL = 6500

/** A foto fixa abre a sequência (sem legenda) */
const all = computed(() => [{ src: props.first, slug: '', title: '', kind: 'fachada' as const }, ...props.slides])
const index = ref(0)
/** Só as fotos que já foram vistas ou a próxima ficam no HTML: a abertura não baixa tudo de uma vez */
const loaded = ref(new Set([0]))
const paused = ref(false)
const hovering = ref(false)
const reduced = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

const current = computed(() => all.value[index.value])
const running = computed(() => !paused.value && !hovering.value && !reduced.value && all.value.length > 1)

function show(next: number) {
    index.value = (next + all.value.length) % all.value.length
    loaded.value.add(index.value)
    loaded.value.add((index.value + 1) % all.value.length)
}

function tick() {
    if (running.value) show(index.value + 1)
}

onMounted(() => {
    reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Espera a página terminar de abrir antes de baixar a segunda foto
    setTimeout(() => loaded.value.add(1 % all.value.length), 1500)
    timer = setInterval(tick, INTERVAL)
})
onBeforeUnmount(() => clearInterval(timer))

const label = (slide: { title: string, kind: string }) => (slide.title ? `${slide.title}: ${slide.kind === 'lazer' ? 'áreas de lazer' : 'fachada'}` : '')
</script>

<template>
    <div class="hero-bg" @mouseenter="hovering = true" @mouseleave="hovering = false" @focusin="hovering = true" @focusout="hovering = false">
        <template v-for="(slide, i) in all" :key="slide.src">
            <img v-if="loaded.has(i)" :src="slide.src" :alt="i === 0 ? firstAlt : label(slide)" class="slide" :class="{ on: i === index }" :fetchpriority="i === 0 ? 'high' : 'low'" :loading="i === 0 ? 'eager' : 'lazy'" decoding="async" :aria-hidden="i !== index">
        </template>

        <div v-if="all.length > 1" class="controls">
            <a v-if="current.slug" class="caption" :href="`/imovel/${current.slug}`" @click.prevent="$router.push(`/imovel/${current.slug}`)">{{ label(current) }}</a>
            <button type="button" class="pause" :aria-label="paused || reduced ? 'Retomar a passagem das fotos' : 'Pausar a passagem das fotos'" @click="paused = !paused; reduced = false">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                    <path v-if="running" d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
                    <path v-else d="M4 2.500v11l9-5.500z" fill="currentColor" />
                </svg>
            </button>
        </div>
    </div>
</template>

<style scoped>
.hero-bg { position: absolute; inset: 0; }
.slide { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 40%; opacity: 0; transition: opacity 1.6s ease; }
.slide.on { opacity: 1; }
.controls { position: absolute; right: 16px; bottom: 76px; z-index: 3; display: flex; align-items: center; gap: 12px; }
.caption { padding: 6px 12px; background: rgba(38, 43, 41, .6); color: var(--bg); font-size: .8rem; }
.caption:hover { background: rgba(38, 43, 41, .85); }
.pause { width: 44px; height: 44px; display: grid; place-items: center; border: 1px solid rgba(245, 242, 235, .6); background: rgba(38, 43, 41, .5); color: var(--bg); border-radius: 50%; }
.pause:hover { background: rgba(38, 43, 41, .8); }
@media (prefers-reduced-motion: reduce) { .slide { transition: none; } }
@media (min-width: 760px) { .controls { right: 24px; bottom: 80px; } }
</style>

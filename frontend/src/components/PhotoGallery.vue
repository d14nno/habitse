<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

import AppIcon from './AppIcon.vue'

const props = defineProps<{ photos: string[], title: string }>()

const track = ref<HTMLElement | null>(null)
const index = ref(0)
const lightbox = ref(false)
const lightTrack = ref<HTMLElement | null>(null)

/** Foto atual a partir da posição da rolagem (o navegador cuida do "grudar" com scroll-snap) */
function onScroll(event: Event) {
    const element = event.target as HTMLElement
    const next = Math.round(element.scrollLeft / element.clientWidth)
    if (next !== index.value && next >= 0 && next < props.photos.length) index.value = next
}

function goTo(target: HTMLElement | null, position: number, smooth = true) {
    if (!target) return
    const bounded = Math.max(0, Math.min(props.photos.length - 1, position))
    target.scrollTo({ left: bounded * target.clientWidth, behavior: smooth ? 'smooth' : 'auto' })
}

async function openLightbox(at: number) {
    index.value = at
    lightbox.value = true
    document.body.classList.add('locked')
    await nextTick()
    goTo(lightTrack.value, at, false)
    lightTrack.value?.focus()
}

function closeLightbox() {
    lightbox.value = false
    document.body.classList.remove('locked')
    nextTick(() => goTo(track.value, index.value, false))
}

function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') closeLightbox()
    if (event.key === 'ArrowRight') goTo(lightTrack.value, index.value + 1)
    if (event.key === 'ArrowLeft') goTo(lightTrack.value, index.value - 1)
}

watch(() => props.photos, () => { index.value = 0 })
onBeforeUnmount(() => document.body.classList.remove('locked'))
</script>

<template>
    <div class="gallery">
        <div ref="track" class="track" @scroll.passive="onScroll">
            <button v-for="(photo, i) in photos" :key="photo" type="button" class="slide" :aria-label="`Ampliar foto ${i + 1} de ${photos.length}`" @click="openLightbox(i)">
                <img :src="photo" :alt="`${title} — foto ${i + 1}`" :loading="i === 0 ? 'eager' : 'lazy'" decoding="async" :fetchpriority="i === 0 ? 'high' : undefined">
            </button>
            <div v-if="!photos.length" class="empty">Sem fotos por enquanto</div>
        </div>

        <span v-if="photos.length > 1" class="counter">{{ index + 1 }} / {{ photos.length }}</span>
        <div v-if="photos.length > 1" class="dots" aria-hidden="true"><i v-for="(photo, i) in photos" :key="photo" :class="{ on: i === index }" /></div>
        <button v-if="photos.length > 1" type="button" class="nav prev" aria-label="Foto anterior" :disabled="index === 0" @click="goTo(track, index - 1)"><AppIcon name="chevron" /></button>
        <button v-if="photos.length > 1" type="button" class="nav next" aria-label="Próxima foto" :disabled="index === photos.length - 1" @click="goTo(track, index + 1)"><AppIcon name="chevron" /></button>
    </div>

    <Teleport to="body">
        <div v-if="lightbox" class="light" role="dialog" aria-modal="true" aria-label="Fotos do imóvel" @keydown="onKey">
            <header>
                <span>{{ index + 1 }} / {{ photos.length }}</span>
                <button type="button" aria-label="Fechar fotos" @click="closeLightbox"><AppIcon name="close" :size="26" /></button>
            </header>
            <div ref="lightTrack" class="ltrack" tabindex="0" @scroll.passive="onScroll">
                <div v-for="(photo, i) in photos" :key="photo" class="lslide">
                    <img :src="photo" :alt="`${title} — foto ${i + 1}`" decoding="async">
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.gallery { position: relative; background: #dfe8e5; }
.track { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -webkit-overflow-scrolling: touch; overscroll-behavior-x: contain; }
.track::-webkit-scrollbar { display: none; }
.slide { flex: none; width: 100%; aspect-ratio: 4 / 3; padding: 0; border: 0; background: transparent; scroll-snap-align: center; scroll-snap-stop: always; }
.slide img { width: 100%; height: 100%; object-fit: cover; }
.empty { display: grid; place-items: center; width: 100%; aspect-ratio: 4 / 3; color: var(--ink-3); }
.counter { position: absolute; right: 12px; bottom: 12px; padding: 4px 10px; border-radius: 999px; background: rgba(16, 32, 29, .75); color: #fff; font-size: .8rem; font-weight: 700; }
.dots { position: absolute; left: 0; right: 0; bottom: 12px; display: flex; justify-content: center; gap: 5px; pointer-events: none; }
.dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255, 255, 255, .6); transition: all .2s ease; }
.dots i.on { width: 16px; border-radius: 99px; background: #fff; }
.nav { display: none; position: absolute; top: 50%; width: 44px; height: 44px; margin-top: -22px; place-items: center; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .92); box-shadow: 0 2px 10px rgba(0, 0, 0, .2); }
.nav[disabled] { opacity: 0; pointer-events: none; }
.prev { left: 12px; transform: scaleX(-1); }
.next { right: 12px; }
@media (hover: hover) and (pointer: fine) { .nav { display: grid; } }
@media (min-width: 900px) { .slide, .empty { aspect-ratio: 16 / 10; } .gallery { border-radius: var(--radius); overflow: hidden; } }

.light { position: fixed; inset: 0; z-index: 80; display: flex; flex-direction: column; background: #050b0a; color: #fff; }
.light header { display: flex; align-items: center; justify-content: space-between; padding: calc(8px + env(safe-area-inset-top, 0px)) 8px 8px 18px; font-weight: 700; }
.light header button { width: 48px; height: 48px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .12); color: #fff; }
.ltrack { flex: 1; display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; outline: none; overscroll-behavior: contain; }
.ltrack::-webkit-scrollbar { display: none; }
.lslide { flex: none; width: 100%; height: 100%; display: grid; place-items: center; scroll-snap-align: center; scroll-snap-stop: always; }
.lslide img { max-width: 100%; max-height: 100%; object-fit: contain; }
</style>

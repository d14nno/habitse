<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import { listingsApi } from '@/api/client'
import { APPROX_RADIUS, buildPoints, loadPlaces } from '@/utils/mapPoints'

/** Prévia do mapa na página inicial: sem arrastar nem zoom; tocar leva ao mapa completo */
const el = ref<HTMLElement | null>(null)
let map: L.Map | null = null

onMounted(async () => {
    if (!el.value) return

    map = L.map(el.value, {
        zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false,
        touchZoom: false, boxZoom: false, keyboard: false
    }).setView([-16.69, -49.27], 11)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    L.control.attribution({ prefix: false, position: 'bottomleft' }).addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>').addTo(map)

    try {
        const [result, places] = await Promise.all([listingsApi.list({ perPage: 50 }), loadPlaces()])
        const { points } = buildPoints(result.data, places)
        if (!map || !points.length) return

        for (const point of points) {
            if (point.approx) L.circle([point.lat, point.lng], { radius: APPROX_RADIUS, color: '#173d36', weight: 1, fillColor: '#173d36', fillOpacity: 0.12, interactive: false }).addTo(map)
            L.circleMarker([point.lat, point.lng], { radius: 6, color: '#f5f2eb', weight: 2, fillColor: '#173d36', fillOpacity: 1, interactive: false }).addTo(map)
        }
        // Os pontos mais afastados (cidades vizinhas) não entram no enquadramento: a prévia mostra o miolo da região
        const core = points.filter(point => Math.abs(point.lat + 16.69) < 0.09 && Math.abs(point.lng + 49.27) < 0.12)
        const view = core.length ? core : points
        map.fitBounds(L.latLngBounds(view.map(point => [point.lat, point.lng] as [number, number])), { padding: [24, 24], maxZoom: 14 })
    } catch {
        // Sem dados a prévia mostra só o mapa; o link continua funcionando
    }
})

onBeforeUnmount(() => {
    map?.remove()
    map = null
})
</script>

<template>
    <div class="mini">
        <div ref="el" class="map" aria-hidden="true" />
        <RouterLink to="/mapa" class="open" aria-label="Abrir o mapa de imóveis"><span class="btn primary">Abrir o mapa</span></RouterLink>
    </div>
</template>

<style scoped>
.mini { position: relative; margin-top: 24px; aspect-ratio: 4 / 3; border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; background: var(--brand-soft); isolation: isolate; }
.map { position: absolute; inset: 0; }
.open { position: absolute; inset: 0; z-index: 500; display: flex; align-items: flex-end; justify-content: flex-end; padding: 12px; }
.open .btn { min-height: 40px; padding: 0 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, .25); }
</style>

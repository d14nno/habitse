<script setup lang="ts">
import { SITE, whatsappLink } from '@/config'
import { ALL_SLUG } from '@/utils/categories'
import { useFavorites } from '@/composables/useFavorites'
import AppIcon from './AppIcon.vue'

const favorites = useFavorites()

const TABS = [
    { to: '/', label: 'Início', icon: 'home', exact: true },
    { to: `/${ALL_SLUG}`, label: 'Imóveis', icon: 'search' },
    { to: '/mapa', label: 'Mapa', icon: 'pin' },
    { to: '/favoritos', label: 'Favoritos', icon: 'heart' }
]
const message = `Olá! Vim pelo site da ${SITE.name} e gostaria de conversar com um consultor.`
</script>

<template>
    <!-- Barra de navegação inferior: alcance do polegar. Some em telas grandes. -->
    <nav class="tabs" aria-label="Navegação principal">
        <RouterLink v-for="tab in TABS" :key="tab.to" :to="tab.to" :exact-active-class="tab.exact ? 'on' : undefined" :active-class="tab.exact ? undefined : 'on'">
            <span class="ico">
                <AppIcon :name="tab.icon" :size="22" />
                <i v-if="tab.icon === 'heart' && favorites.count.value" class="n">{{ favorites.count.value }}</i>
            </span>
            {{ tab.label }}
        </RouterLink>
        <a class="wa" :href="whatsappLink(message)" target="_blank" rel="noopener"><AppIcon name="whatsapp" :size="22" />WhatsApp</a>
    </nav>
</template>

<style scoped>
.tabs { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; display: grid; grid-template-columns: repeat(5, 1fr); height: calc(var(--nav-h) + var(--safe-bottom)); padding-bottom: var(--safe-bottom); background: var(--card); border-top: 1px solid var(--line); }
a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: .72rem; font-weight: 600; color: var(--ink-3); }
a.on { color: var(--brand); box-shadow: inset 0 2px 0 var(--sand); }
a.wa { background: var(--brand); color: var(--bg); }
.ico { position: relative; display: grid; place-items: center; }
.n { position: absolute; top: -5px; right: -9px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 99px; background: var(--brand); color: var(--bg); font-size: .64rem; font-style: normal; font-weight: 600; display: grid; place-items: center; }
@media (min-width: 900px) { .tabs { display: none; } }
</style>

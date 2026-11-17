<script setup lang="ts">
import { useFavorites } from '@/composables/useFavorites'
import AppIcon from './AppIcon.vue'

const favorites = useFavorites()

const TABS = [
    { to: '/', label: 'Início', icon: 'home', exact: true },
    { to: '/usados', label: 'Usados', icon: 'key' },
    { to: '/na-planta', label: 'Na planta', icon: 'blueprint' },
    { to: '/em-construcao', label: 'Em obra', icon: 'crane' },
    { to: '/favoritos', label: 'Favoritos', icon: 'heart' }
]
</script>

<template>
    <!-- Barra de navegação inferior: alcance do polegar. Some em telas grandes. -->
    <nav class="tabs" aria-label="Navegação principal">
        <RouterLink v-for="tab in TABS" :key="tab.to" :to="tab.to" :exact-active-class="tab.exact ? 'on' : undefined" :active-class="tab.exact ? undefined : 'on'">
            <span class="ico">
                <AppIcon :name="tab.icon" :size="23" />
                <i v-if="tab.icon === 'heart' && favorites.count.value" class="n">{{ favorites.count.value }}</i>
            </span>
            {{ tab.label }}
        </RouterLink>
    </nav>
</template>

<style scoped>
.tabs { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; display: grid; grid-template-columns: repeat(5, 1fr); height: calc(var(--nav-h) + var(--safe-bottom)); padding-bottom: var(--safe-bottom); background: rgba(255, 255, 255, .96); backdrop-filter: blur(10px); border-top: 1px solid var(--line); }
a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; font-size: .7rem; font-weight: 600; color: var(--ink-3); transition: color .15s ease; }
a.on { color: var(--brand); }
a:active .ico { transform: scale(.9); }
.ico { position: relative; display: grid; place-items: center; transition: transform .12s ease; }
.n { position: absolute; top: -5px; right: -9px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 99px; background: #e11d48; color: #fff; font-size: .64rem; font-style: normal; font-weight: 700; display: grid; place-items: center; }
@media (min-width: 900px) { .tabs { display: none; } }
</style>

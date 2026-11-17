<script setup lang="ts">
import { CATEGORIES } from '@/utils/categories'
import { useFavorites } from '@/composables/useFavorites'
import AppIcon from './AppIcon.vue'
import AppLogo from './AppLogo.vue'

const favorites = useFavorites()
</script>

<template>
    <header class="top">
        <div class="container bar">
            <RouterLink to="/" class="brand" aria-label="Habitse — página inicial"><AppLogo /></RouterLink>

            <!-- Navegação de computador/tablet. No celular quem navega é a barra inferior -->
            <nav class="desk" aria-label="Categorias">
                <RouterLink v-for="category in CATEGORIES" :key="category.key" :to="`/${category.slug}`">{{ category.short }}</RouterLink>
            </nav>

            <RouterLink to="/favoritos" class="fav" aria-label="Favoritos">
                <AppIcon name="heart" :size="22" />
                <span v-if="favorites.count.value" class="dot">{{ favorites.count.value }}</span>
            </RouterLink>
        </div>
    </header>
</template>

<style scoped>
.top { position: sticky; top: 0; z-index: 30; background: rgba(255, 255, 255, .92); backdrop-filter: saturate(1.4) blur(10px); border-bottom: 1px solid var(--line); }
.bar { height: var(--header-h); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.desk { display: none; gap: 6px; margin-left: auto; }
.desk a { padding: 8px 14px; border-radius: 999px; font-weight: 600; color: var(--ink-2); }
.desk a.router-link-active { background: var(--brand-soft); color: var(--brand); }
.fav { position: relative; width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; color: var(--ink-2); }
.fav.router-link-active { color: #e11d48; }
.dot { position: absolute; top: 2px; right: 0; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 99px; background: #e11d48; color: #fff; font-size: .7rem; font-weight: 700; display: grid; place-items: center; }
@media (min-width: 900px) { .desk { display: flex; } .fav { margin-left: 0; } }
</style>

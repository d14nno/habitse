<script setup lang="ts">
import { SITE, whatsappLink } from '@/config'
import { ALL_SLUG, CATEGORIES } from '@/utils/categories'
import { useFavorites } from '@/composables/useFavorites'
import AppIcon from './AppIcon.vue'
import AppLogo from './AppLogo.vue'

const favorites = useFavorites()
const message = `Olá! Vim pelo site da ${SITE.name} e gostaria de conversar com um consultor.`
</script>

<template>
    <header class="top">
        <div class="container bar">
            <RouterLink to="/" class="brand" aria-label="Habitse, página inicial"><AppLogo /></RouterLink>

            <!-- Navegação de computador/tablet. No celular quem navega é a barra inferior -->
            <nav class="desk" aria-label="Categorias">
                <RouterLink v-for="category in CATEGORIES" :key="category.key" :to="`/${category.slug}`">{{ category.short }}</RouterLink>
                <RouterLink :to="`/${ALL_SLUG}`">Todos os imóveis</RouterLink>
            </nav>

            <div class="end">
                <RouterLink to="/favoritos" class="fav" aria-label="Favoritos">
                    <AppIcon name="heart" :size="22" />
                    <span v-if="favorites.count.value" class="dot">{{ favorites.count.value }}</span>
                </RouterLink>
                <a class="btn consult" :href="whatsappLink(message)" target="_blank" rel="noopener">Conversar com um consultor</a>
            </div>
        </div>
    </header>
</template>

<style scoped>
.top { position: sticky; top: 0; z-index: 30; background: rgba(245, 242, 235, .96); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
.bar { height: var(--header-h); display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.desk { display: none; gap: 22px; margin-left: auto; white-space: nowrap; }
.desk a { padding: 8px 0; font-size: .94rem; color: var(--ink); border-bottom: 1px solid transparent; }
.desk a:hover, .desk a.router-link-active { color: var(--brand); border-bottom-color: var(--sand); }
.end { display: flex; align-items: center; gap: 12px; }
.consult { display: none; min-height: 44px; white-space: nowrap; }
.fav { position: relative; width: 44px; height: 44px; display: grid; place-items: center; color: var(--brand); }
.fav.router-link-active { color: #9f2a1d; }
.dot { position: absolute; top: 3px; right: 0; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 99px; background: var(--brand); color: var(--bg); font-size: .7rem; font-weight: 600; display: grid; place-items: center; }
@media (min-width: 900px) { .desk { display: flex; gap: 16px; font-size: .88rem; } }
@media (min-width: 1180px) { .desk { gap: 22px; font-size: 1rem; } .consult { display: inline-flex; } }
</style>

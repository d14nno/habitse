<script setup lang="ts">
import { SITE, whatsappLink } from '@/config'
import { CATEGORIES } from '@/utils/categories'
import AppLogo from './AppLogo.vue'
</script>

<template>
    <footer class="foot">
        <div class="container grid3">
            <div>
                <AppLogo light />
                <p>Imóveis usados, na planta e em construção, com atendimento direto e sem enrolação.</p>
            </div>
            <nav aria-label="Rodapé">
                <b>Explore</b>
                <RouterLink v-for="category in CATEGORIES" :key="category.key" :to="`/${category.slug}`">{{ category.label }}</RouterLink>
                <RouterLink to="/favoritos">Meus favoritos</RouterLink>
            </nav>
            <div>
                <b>Fale com a gente</b>
                <a :href="whatsappLink('Olá! Vim pelo site da Habitse e gostaria de ajuda para encontrar um imóvel.')" target="_blank" rel="noopener">WhatsApp</a>
                <p class="small">(62) 99832-2361 · {{ SITE.domain }}</p>
            </div>
        </div>
        <p class="container legal">© {{ new Date().getFullYear() }} Habitse. CRECI {{ SITE.creci }}. Valores e condições sujeitos a alteração sem aviso. Imagens meramente ilustrativas.</p>
    </footer>
</template>

<style scoped>
.foot { margin-top: 40px; padding: 32px 0 20px; background: #0c2a26; color: #cfe0dc; font-size: .93rem; }
.grid3 { display: grid; gap: 24px; }
b { display: block; margin-bottom: 8px; color: #fff; }
nav, div { display: flex; flex-direction: column; gap: 4px; }
nav a, div a { padding: 6px 0; min-height: 32px; }
p { margin-top: 10px; line-height: 1.5; }
.small { margin-top: 4px; opacity: .8; }
.legal { margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, .12); font-size: .8rem; opacity: .75; }
@media (min-width: 760px) { .grid3 { grid-template-columns: 1.4fr 1fr 1fr; } }
@media (max-width: 899px) { .foot { padding-bottom: 28px; } }
</style>

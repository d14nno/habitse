<script setup lang="ts">
import { SITE, whatsappLink } from '@/config'
import { ALL_SLUG, CATEGORIES } from '@/utils/categories'
import AppLogo from './AppLogo.vue'
</script>

<template>
    <footer class="foot">
        <div class="container grid4">
            <div>
                <AppLogo light />
            </div>
            <nav aria-label="Imóveis">
                <b>Imóveis</b>
                <RouterLink v-for="category in CATEGORIES" :key="category.key" :to="`/${category.slug}`">{{ category.label }}</RouterLink>
                <RouterLink :to="`/${ALL_SLUG}`">Todos os imóveis</RouterLink>
            </nav>
            <div>
                <b>Contato</b>
                <a :href="whatsappLink(`Olá! Vim pelo site da ${SITE.name} e gostaria de ajuda para encontrar um imóvel.`)" target="_blank" rel="noopener">WhatsApp {{ SITE.phone }}</a>
                <a v-if="SITE.social.facebook" :href="SITE.social.facebook" target="_blank" rel="noopener">Facebook</a>
                <a v-if="SITE.social.instagram" :href="SITE.social.instagram" target="_blank" rel="noopener">Instagram</a>
                <p class="small">{{ SITE.consultant }}<br>CRECI {{ SITE.creci }}</p>
            </div>
        </div>
        <p class="container legal">© {{ new Date().getFullYear() }} Habitse. Imagens ilustrativas; valores e disponibilidade sujeitos a confirmação.</p>
    </footer>
</template>

<style scoped>
.foot { margin-top: 72px; padding: 44px 0 24px; background: var(--brand-dark); color: #d9d4c8; font-size: .94rem; }
.grid4 { display: grid; gap: 32px; }
b { display: block; margin-bottom: 10px; color: var(--bg); font-weight: 600; }
nav, div { display: flex; flex-direction: column; gap: 4px; }
nav a, div a { padding: 6px 0; min-height: 32px; }
nav a:hover, div a:hover { color: #fff; text-decoration: underline; text-decoration-color: var(--sand); text-underline-offset: 5px; }
p { margin-top: 12px; line-height: 1.6; max-width: 34ch; }
.small { margin-top: 6px; opacity: .85; }
.legal { margin-top: 40px; padding-top: 20px; max-width: 1180px; border-top: 1px solid #2c4b44; font-size: .8rem; line-height: 1.6; color: #b9b4a8; }
@media (min-width: 760px) { .grid4 { grid-template-columns: 1.4fr 1.2fr 1.4fr; gap: 48px; } }
@media (max-width: 899px) { .foot { padding-bottom: 36px; } }
</style>

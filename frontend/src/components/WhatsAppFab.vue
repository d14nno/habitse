<script setup lang="ts">
import { whatsappLink } from '@/config'
import AppIcon from './AppIcon.vue'

withDefaults(defineProps<{ message?: string }>(), { message: 'Olá! Vim pelo site da Habitse e gostaria de ajuda para encontrar um imóvel.' })
</script>

<template>
    <a class="fab" :href="whatsappLink(message)" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
        <AppIcon name="whatsapp" :size="26" />
        <span>WhatsApp</span>
    </a>
</template>

<style scoped>
/* Acima da barra inferior; no computador vira um botão com texto no canto */
.fab { position: fixed; right: 14px; bottom: calc(var(--nav-h) + var(--safe-bottom) + 14px); z-index: 35; display: inline-flex; align-items: center; gap: 8px; height: 54px; padding: 0 16px; border-radius: 999px; background: var(--wa); color: #fff; font-weight: 700; box-shadow: 0 6px 20px rgba(31, 168, 85, .45); transition: transform .12s ease; }
.fab:active { transform: scale(.94); }
.fab span { display: none; }
@media (min-width: 900px) { .fab { bottom: 24px; right: 24px; } .fab span { display: inline; } }
</style>

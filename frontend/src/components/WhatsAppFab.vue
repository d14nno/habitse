<script setup lang="ts">
import { SITE, whatsappLink } from '@/config'
import AppIcon from './AppIcon.vue'

withDefaults(defineProps<{ message?: string }>(), { message: `Olá! Vim pelo site da ${SITE.name} e gostaria de ajuda para encontrar um imóvel.` })
</script>

<template>
    <!-- Só no computador: no celular o WhatsApp fica na barra inferior -->
    <a class="fab" :href="whatsappLink(message)" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">
        <AppIcon name="whatsapp" :size="24" />
        <span>WhatsApp</span>
    </a>
</template>

<style scoped>
.fab { display: none; position: fixed; right: 24px; bottom: 24px; z-index: 35; align-items: center; gap: 8px; height: 52px; padding: 0 20px; border-radius: var(--radius-sm); background: var(--brand); color: var(--bg); font-weight: 600; border: 1px solid var(--sand); transition: background-color .15s ease; }
.fab:hover { background: var(--brand-dark); }
@media (min-width: 900px) { .fab { display: inline-flex; } }
</style>

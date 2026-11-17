<script setup lang="ts">
import { onMounted } from 'vue'

import { setSeo } from '@/composables/useSeo'

onMounted(() => setSeo({ title: 'Página não encontrada' }))
</script>

<template>
    <div class="container nf">
        <h1>Página não encontrada</h1>
        <p>O endereço que você abriu não existe mais ou foi digitado errado.</p>
        <RouterLink to="/" class="btn primary">Ir para o início</RouterLink>
    </div>
</template>

<style scoped>
.nf { display: grid; justify-items: start; gap: 12px; padding-top: 56px; }
h1 { font-size: 1.6rem; }
p { color: var(--ink-2); }
</style>

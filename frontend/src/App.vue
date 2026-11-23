<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import SiteFooter from '@/components/SiteFooter.vue'

</script>

<template>
    <a class="skip" href="#conteudo">Ir para o conteúdo</a>
    <AppHeader />
    <main id="conteudo" class="page">
        <RouterView v-slot="{ Component }">
            <component :is="Component" />
        </RouterView>
        <SiteFooter />
    </main>
    <BottomNav />
</template>

<style>
.skip { position: absolute; left: -999px; top: 8px; z-index: 100; padding: 10px 14px; background: #fff; border-radius: 8px; font-weight: 700; }
.skip:focus { left: 8px; }
</style>

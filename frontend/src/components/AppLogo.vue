<script setup lang="ts">
withDefaults(defineProps<{ light?: boolean, size?: number }>(), { light: false, size: 32 })
</script>

<template>
    <span class="logo" :class="{ light }" aria-label="Habitse">
        <!-- Pórtico: dois pilares de alturas diferentes e uma travessa de areia formam o H -->
        <svg :width="size" :height="size" viewBox="0 0 40 40" aria-hidden="true">
            <rect x="5" y="4" width="8" height="32" fill="currentColor" />
            <rect x="27" y="12" width="8" height="24" fill="currentColor" />
            <rect x="13" y="19" width="14" height="5" fill="#c4b69e" />
        </svg>
        <b>Habitse</b>
    </span>
</template>

<style scoped>
.logo { display: inline-flex; align-items: center; gap: 11px; color: var(--brand); }
.logo b { font-family: var(--serif); font-size: 1.65rem; font-weight: 600; letter-spacing: -.015em; line-height: 1; color: inherit; }
.logo.light { color: var(--bg); }
</style>

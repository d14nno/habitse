<script setup lang="ts">
withDefaults(defineProps<{ light?: boolean, size?: number }>(), { light: false, size: 28 })
</script>

<template>
    <span class="logo" :class="{ light }" aria-label="Habitse">
        <svg :width="size" :height="size" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="9" fill="currentColor" class="bg" />
            <path d="M8 15.2 16 8l8 7.2V24h-5.2v-5.4h-5.6V24H8z" fill="#fff" />
            <circle cx="22.4" cy="9.6" r="2.4" fill="#f5b942" />
        </svg>
        <b>Habitse</b>
    </span>
</template>

<style scoped>
.logo { display: inline-flex; align-items: center; gap: 8px; color: var(--brand); }
.logo b { font-size: 1.22rem; letter-spacing: -.03em; color: var(--ink); }
.logo.light { color: #fff; }
.logo.light b { color: #fff; }
.logo.light .bg { fill: rgba(255, 255, 255, .16); }
</style>

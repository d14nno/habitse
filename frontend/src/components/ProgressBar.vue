<script setup lang="ts">
/** Andamento da obra (0–100%) */
withDefaults(defineProps<{ value: number, compact?: boolean }>(), { compact: false })
</script>

<template>
    <div class="progress" :class="{ compact }" role="progressbar" :aria-valuenow="value" aria-valuemin="0" aria-valuemax="100" :aria-label="`Obra ${value}% concluída`">
        <div class="track"><i :style="{ width: `${Math.min(100, Math.max(0, value))}%` }" /></div>
        <span>Obra {{ value }}% concluída</span>
    </div>
</template>

<style scoped>
.progress { margin-top: 10px; }
.track { height: 8px; border-radius: 99px; background: #f3e2d2; overflow: hidden; }
.track i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #e08a3c, var(--build)); transition: width .6s ease; }
span { display: block; margin-top: 5px; font-size: .82rem; font-weight: 700; color: var(--build); }
.compact .track { height: 6px; }
.compact span { font-size: .78rem; }
</style>

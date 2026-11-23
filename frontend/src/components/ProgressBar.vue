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
.progress { margin-top: 12px; }
.track { height: 4px; background: var(--line); overflow: hidden; }
.track i { display: block; height: 100%; background: var(--brand); transition: width .6s ease; }
span { display: block; margin-top: 6px; font-size: .82rem; font-weight: 500; color: var(--ink-3); }
</style>

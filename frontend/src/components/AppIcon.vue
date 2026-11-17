<script setup lang="ts">
/** Ícones de traço (24px), sem biblioteca: só o que o site usa */
defineProps<{ name: string, size?: number }>()

const PATHS: Record<string, string> = {
    home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10',
    key: 'M14.5 9.5a4 4 0 1 0-3.9 3.1L4 19.2V21h2.4v-1.8h1.8v-1.8h1.8l1.9-1.9a4 4 0 0 0 2.6-6zM16 8h.01',
    blueprint: 'M4 4h16v16H4zM4 9h16M9 9v11M14 14h6',
    crane: 'M3 21h18M6 21V8l8-5M6 8h12M14 3v5M18 8v6M17 14h2v2h-2zM10 21v-6h4v6',
    heart: 'M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 7.5 2.9c0 5.5-7.5 10.1-7.5 10.1z',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5',
    filter: 'M4 6h16M7 12h10M10 18h4',
    pin: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8z',
    bed: 'M3 18V7M3 13h18v5M21 13v-2a3 3 0 0 0-3-3h-7v5M7 11h.01',
    car: 'M5 16V12l1.6-4.2A2 2 0 0 1 8.5 6.5h7a2 2 0 0 1 1.9 1.3L19 12v4M5 16h14M5 16v2M19 16v2M8 13h.01M16 13h.01',
    area: 'M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6',
    bath: 'M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
    share: 'M12 4v11M8 8l4-4 4 4M5 13v6h14v-6',
    close: 'M6 6l12 12M18 6 6 18',
    chevron: 'M9 6l6 6-6 6',
    check: 'M5 12.5l4.5 4.5L19 7.5',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z',
    whatsapp: 'M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3zM9 8.5c.2 3 2.5 5.3 5.5 5.5l1.2-1.2-1.8-1-.9.7a4 4 0 0 1-1.7-1.7l.7-.9-1-1.8z'
}
</script>

<template>
    <svg :width="size ?? 22" :height="size ?? 22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path :d="PATHS[name] ?? ''" />
    </svg>
</template>

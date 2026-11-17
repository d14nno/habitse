<template>
    <div class="sk" aria-hidden="true">
        <div class="skeleton img" />
        <div class="lines">
            <div class="skeleton" style="height: 24px; width: 46%" />
            <div class="skeleton" style="height: 16px; width: 88%" />
            <div class="skeleton" style="height: 14px; width: 64%" />
        </div>
    </div>
</template>

<style scoped>
.sk { background: var(--card); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
.img { aspect-ratio: 4 / 3; border-radius: 0; }
.lines { display: grid; gap: 10px; padding: 16px; }
</style>

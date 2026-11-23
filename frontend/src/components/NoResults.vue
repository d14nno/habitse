<script setup lang="ts">
import { SITE, whatsappLink } from '@/config'

/**
 * Quando não há imóveis para mostrar: nada de anúncio inventado, só o caminho para um atendimento personalizado.
 * `topic` descreve o que a pessoa procurava (categoria, bairro, filtros), para o consultor já receber o contexto.
 */
const props = withDefaults(defineProps<{ title?: string, text?: string, topic?: string, canClear?: boolean }>(), {
    title: 'Nenhum imóvel com essas características no momento.',
    text: 'Não mostramos anúncios que não existem. Ajuste os filtros ou conte o que você procura: um consultor faz uma busca personalizada e responde pelo WhatsApp.',
    topic: '',
    canClear: false
})
const emit = defineEmits<{ clear: [] }>()

const link = () => whatsappLink(`Olá! Vim pelo site da ${SITE.name} e gostaria de uma busca personalizada${props.topic ? `: ${props.topic}` : ''}.`)
</script>

<template>
    <section class="none" aria-live="polite">
        <div>
            <h2>{{ title }}</h2>
            <p>{{ text }}</p>
        </div>
        <div class="actions">
            <button v-if="canClear" type="button" class="btn" @click="emit('clear')">Limpar filtros</button>
            <a class="btn primary" :href="link()" target="_blank" rel="noopener">Pedir busca personalizada</a>
        </div>
    </section>
</template>

<style scoped>
.none { display: grid; gap: 24px; padding: 32px 24px; border: 1px solid var(--line); background: var(--card); border-radius: var(--radius); }
h2 { font-size: 1.6rem; line-height: 1.2; }
p { margin-top: 10px; max-width: 54ch; color: var(--ink-3); line-height: 1.6; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; }
@media (min-width: 760px) { .none { grid-template-columns: minmax(0, 1fr) auto; align-items: center; padding: 40px 44px; gap: 48px; } }
</style>

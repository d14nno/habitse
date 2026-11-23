<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { whatsappLink } from '@/config'
import { buildUpgradeMessage, EMPTY_UPGRADE, parseMoney, UPGRADE_STATUS, UPGRADE_TYPES, validateUpgrade, type UpgradeForm } from '@/utils/upgrade'
import { formatPrice } from '@/utils/format'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ open: boolean, interest?: string }>()
const emit = defineEmits<{ close: [] }>()

const form = ref<UpgradeForm>({ ...EMPTY_UPGRADE })
const errors = ref<Record<string, string>>({})
const sent = ref(false)
const sheet = ref<HTMLElement | null>(null)

watch(() => props.open, async open => {
    document.body.classList.toggle('locked', open)
    if (open) {
        sent.value = false
        errors.value = {}
        form.value = { ...form.value, interest: props.interest ?? form.value.interest }
        await nextTick()
        sheet.value?.focus()
    }
})
onBeforeUnmount(() => document.body.classList.remove('locked'))

const statusDetailLabel = computed(() => UPGRADE_STATUS.find(item => item.value === form.value.status)?.detailLabel)
const link = computed(() => whatsappLink(buildUpgradeMessage(form.value)))

/** Mostra o valor formatado ao sair do campo (R$ 650.000), mas guarda o que foi digitado enquanto edita */
function formatPriceField() {
    const value = parseMoney(form.value.price)
    form.value.price = value === null ? '' : formatPrice(value).replace(/\s/g, ' ')
}

function submit(event: Event) {
    errors.value = validateUpgrade(form.value)
    if (Object.keys(errors.value).length) {
        event.preventDefault()
        nextTick(() => sheet.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
        return
    }
    // O clique no link abre o WhatsApp com a mensagem pronta; a tela passa a orientar o próximo passo
    sent.value = true
}
</script>

<template>
    <Teleport to="body">
        <Transition name="sheet">
            <div v-if="open" class="overlay" @click.self="emit('close')" @keydown.esc="emit('close')">
                <section ref="sheet" class="sheet" role="dialog" aria-modal="true" aria-labelledby="upgrade-title" tabindex="-1">
                    <header>
                        <h2 id="upgrade-title">Avaliar meu imóvel</h2>
                        <button type="button" class="x" aria-label="Fechar" @click="emit('close')"><AppIcon name="close" /></button>
                    </header>

                    <div v-if="sent" class="done">
                        <h3>Mensagem pronta no WhatsApp.</h3>
                        <p>Se o WhatsApp não abriu, toque no botão abaixo. Basta enviar a mensagem; depois, se puder, mande algumas fotos do imóvel na própria conversa.</p>
                        <div class="actions">
                            <a class="btn primary" :href="link" target="_blank" rel="noopener">Abrir o WhatsApp</a>
                            <button type="button" class="btn" @click="sent = false">Corrigir dados</button>
                        </div>
                    </div>

                    <form v-else class="content" novalidate @submit.prevent>
                        <p class="lead">Uma análise inicial, sem compromisso: o valor só é definido na conversa com o consultor.</p>

                        <label>Tipo do imóvel
                            <select v-model="form.type" :aria-invalid="!!errors.type"><option v-for="type in UPGRADE_TYPES" :key="type" :value="type">{{ type }}</option></select>
                            <small v-if="errors.type" class="err">{{ errors.type }}</small>
                        </label>

                        <div class="two">
                            <label>Bairro
                                <input v-model="form.neighborhood" type="text" autocomplete="off" placeholder="Ex.: Setor Bueno" :aria-invalid="!!errors.neighborhood">
                                <small v-if="errors.neighborhood" class="err">{{ errors.neighborhood }}</small>
                            </label>
                            <label>Cidade
                                <input v-model="form.city" type="text" autocomplete="off">
                            </label>
                        </div>

                        <label>Condomínio ou edifício <span class="opt">(opcional)</span>
                            <input v-model="form.building" type="text" autocomplete="off" placeholder="Nome, sem endereço completo">
                        </label>

                        <div class="two">
                            <label>Área privativa (m²)
                                <input v-model="form.area" type="text" inputmode="decimal" placeholder="Ex.: 98" :aria-invalid="!!errors.area">
                                <small v-if="errors.area" class="err">{{ errors.area }}</small>
                            </label>
                            <label>Valor pretendido
                                <input v-model="form.price" type="text" inputmode="numeric" placeholder="R$" @blur="formatPriceField">
                            </label>
                        </div>

                        <div class="three">
                            <label>Quartos<input v-model="form.bedrooms" type="text" inputmode="numeric" maxlength="2"></label>
                            <label>Suítes<input v-model="form.suites" type="text" inputmode="numeric" maxlength="2"></label>
                            <label>Vagas<input v-model="form.parking" type="text" inputmode="numeric" maxlength="2"></label>
                        </div>

                        <fieldset>
                            <legend>Situação do imóvel</legend>
                            <div class="wrap">
                                <button v-for="item in UPGRADE_STATUS" :key="item.value" type="button" class="chip" :class="{ on: form.status === item.value }" :aria-pressed="form.status === item.value" @click="form.status = form.status === item.value ? '' : item.value">{{ item.label }}</button>
                            </div>
                            <label v-if="statusDetailLabel" class="detail">{{ statusDetailLabel }}
                                <input v-model="form.statusDetail" type="text" autocomplete="off">
                            </label>
                        </fieldset>

                        <label>Tem interesse em algum imóvel? <span class="opt">(opcional)</span>
                            <input v-model="form.interest" type="text" autocomplete="off" placeholder="Ex.: Praça 232">
                        </label>

                        <label>Observações <span class="opt">(opcional)</span>
                            <textarea v-model="form.notes" rows="3" maxlength="400" placeholder="Reforma, ocupação, prazo, o que for útil" />
                        </label>

                        <label>Seu nome
                            <input v-model="form.name" type="text" autocomplete="name" :aria-invalid="!!errors.name">
                            <small v-if="errors.name" class="err">{{ errors.name }}</small>
                        </label>

                        <p class="privacy">Usamos estes dados só para a análise inicial. Não peça nem informe CPF, matrícula ou endereço completo nesta etapa.</p>

                        <a class="btn primary send" :href="link" target="_blank" rel="noopener" @click="submit">Enviar pelo WhatsApp</a>
                    </form>
                </section>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; z-index: 60; background: rgba(38, 43, 41, .5); display: flex; align-items: flex-end; justify-content: center; }
.sheet { width: 100%; max-width: 600px; max-height: 94dvh; display: flex; flex-direction: column; background: var(--bg); border-radius: var(--radius) var(--radius) 0 0; outline: none; }
header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 6px 20px; }
h2 { font-size: 1.6rem; }
.x { width: 44px; height: 44px; display: grid; place-items: center; border: 0; background: transparent; border-radius: 50%; }
.content { overflow-y: auto; padding: 0 20px calc(20px + var(--safe-bottom)); display: grid; gap: 16px; overscroll-behavior: contain; }
.lead { color: var(--ink-3); line-height: 1.55; }
label { display: grid; gap: 6px; font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; color: var(--ink-3); }
.opt { text-transform: none; letter-spacing: 0; font-weight: 400; }
input, select, textarea { min-height: 48px; padding: 0 12px; border: 1px solid #cfc9bb; border-radius: var(--radius-sm); background: var(--card); font: 500 1rem var(--font); letter-spacing: 0; text-transform: none; color: var(--ink); width: 100%; }
textarea { padding: 12px; min-height: 84px; resize: vertical; }
input[aria-invalid='true'], select[aria-invalid='true'] { border-color: var(--danger); }
.err { color: var(--danger); text-transform: none; letter-spacing: 0; font-weight: 500; font-size: .84rem; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.three { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
fieldset { border: 0; padding: 0; margin: 0; display: grid; gap: 10px; }
legend { padding: 0; margin-bottom: 10px; font-size: .78rem; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; color: var(--ink-3); }
.wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.detail { margin-top: 4px; }
.privacy { font-size: .84rem; line-height: 1.5; color: var(--ink-3); }
.send { width: 100%; }
.done { padding: 8px 20px calc(24px + var(--safe-bottom)); }
.done h3 { font-size: 1.4rem; }
.done p { margin-top: 10px; color: var(--ink-3); line-height: 1.6; }
.actions { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 12px; }
.sheet-enter-active, .sheet-leave-active { transition: opacity .2s ease; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform .25s cubic-bezier(.2, .8, .2, 1); }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
@media (min-width: 700px) { .overlay { align-items: center; } .sheet { border-radius: var(--radius); } }
</style>

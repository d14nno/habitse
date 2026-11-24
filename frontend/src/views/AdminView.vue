<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import { adminEmail, AdminError, AdminPermuta, isLoggedIn, login, logout, permutasAdmin } from '@/api/admin'

/** Painel: entrar e editar as permutas/usados que aparecem no site (a mudança vale em cerca de 1 minuto) */
const logged = ref(isLoggedIn())
const email = ref('')
const password = ref('')
const busy = ref(false)
const message = ref('')
const failed = ref(false)

const items = ref<AdminPermuta[]>([])
const editing = ref(false)
const isNew = ref(false)

const TYPES = [['apartamento', 'Apartamento'], ['casa', 'Casa'], ['casa_condominio', 'Casa em condomínio'], ['cobertura', 'Cobertura'], ['terreno', 'Terreno'], ['sala_comercial', 'Sala comercial']]
const STATUS = [['published', 'Publicado'], ['draft', 'Rascunho (oculto)'], ['sold', 'Vendido (oculto)']]

interface Form {
    id: string, tipo: string, cidade: string, bairro: string, condominio: string, quartos: number, suites: number, vagas: number,
    area: number, areaTerreno: number | null, valor: number, valorCondominio: number | null, status: string, destaques: string, fotos: string,
    lat: number | null, lng: number | null, approx: boolean
}

const blank = (): Form => ({ id: '', tipo: 'apartamento', cidade: 'Goiânia', bairro: '', condominio: '', quartos: 0, suites: 0, vagas: 0, area: 0, areaTerreno: null, valor: 0, valorCondominio: null, status: 'published', destaques: '', fotos: '', lat: null, lng: null, approx: true })
const form = reactive<Form>(blank())

const lines = (text: string) => text.split('\n').map(line => line.trim()).filter(Boolean)
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const statusLabel = (status?: string) => STATUS.find(option => option[0] === (status ?? 'published'))?.[1]
const hasPlace = computed(() => typeof form.lat === 'number' && typeof form.lng === 'number')

function notify(text: string, error = false) {
    message.value = text
    failed.value = error
}

async function guard(action: () => Promise<void>) {
    busy.value = true
    notify('')
    try {
        await action()
    } catch (error) {
        if (error instanceof AdminError && error.status === 401) logged.value = false
        notify(error instanceof Error ? error.message : 'Não foi possível concluir.', true)
    } finally {
        busy.value = false
    }
}

const load = () => guard(async () => { items.value = await permutasAdmin.list() })

const signIn = () => guard(async () => {
    await login(email.value.trim(), password.value)
    password.value = ''
    logged.value = true
    items.value = await permutasAdmin.list()
})

async function signOut() {
    await logout()
    logged.value = false
    items.value = []
    editing.value = false
}

function edit(item: AdminPermuta | null) {
    isNew.value = !item
    Object.assign(form, blank(), item ? {
        id: item.id, tipo: item.tipo, cidade: item.cidade, bairro: item.bairro, condominio: item.condominio ?? '', quartos: item.quartos, suites: item.suites ?? 0, vagas: item.vagas ?? 0,
        area: item.area, areaTerreno: item.areaTerreno ?? null, valor: item.valor, valorCondominio: item.valorCondominio, status: item.status ?? 'published',
        destaques: (item.destaques ?? []).join('\n'), fotos: (item.fotos ?? []).join('\n'), lat: item.place?.lat ?? null, lng: item.place?.lng ?? null, approx: item.place?.approx ?? true
    } : {})
    editing.value = true
    notify('')
}

const save = () => guard(async () => {
    const permuta: AdminPermuta = {
        id: form.id.trim(), tipo: form.tipo, cidade: form.cidade.trim(), bairro: form.bairro.trim(), condominio: form.condominio.trim() || null,
        quartos: Number(form.quartos), suites: Number(form.suites) || undefined, vagas: Number(form.vagas) || undefined,
        area: Number(form.area), areaTerreno: form.areaTerreno ? Number(form.areaTerreno) : undefined, valor: Number(form.valor),
        valorCondominio: form.valorCondominio ? Number(form.valorCondominio) : null, status: form.status as AdminPermuta['status'],
        destaques: lines(form.destaques), fotos: lines(form.fotos),
        place: hasPlace.value ? { lat: Number(form.lat), lng: Number(form.lng), approx: form.approx } : null
    }
    await permutasAdmin.save(permuta)
    items.value = await permutasAdmin.list()
    editing.value = false
    notify('Salvo. O site mostra a mudança em cerca de 1 minuto.')
})

const remove = () => {
    if (!confirm('Excluir este anúncio de vez? Para só tirar do site, use o estado "Rascunho".')) return
    return guard(async () => {
        await permutasAdmin.remove(form.id)
        items.value = await permutasAdmin.list()
        editing.value = false
        notify('Excluído.')
    })
}

onMounted(() => {
    document.title = 'Painel · Habitse'
    document.head.querySelector('meta[name="robots"]')?.remove()
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.appendChild(robots)
    if (logged.value) void load()
})
</script>

<template>
    <div class="admin container">
        <h1>Painel</h1>

        <form v-if="!logged" class="card login" @submit.prevent="signIn">
            <label>E-mail<input v-model="email" type="email" autocomplete="username" required></label>
            <label>Senha<input v-model="password" type="password" autocomplete="current-password" required></label>
            <button class="btn primary block" :disabled="busy">{{ busy ? 'Entrando…' : 'Entrar' }}</button>
            <p v-if="message" class="msg" :class="{ bad: failed }" role="alert">{{ message }}</p>
        </form>

        <template v-else>
            <div class="bar">
                <span>{{ adminEmail() }}</span>
                <button class="btn" @click="signOut">Sair</button>
            </div>
            <p v-if="message" class="msg" :class="{ bad: failed }" role="status">{{ message }}</p>

            <section v-if="!editing">
                <div class="bar">
                    <h2>Permutas e usados ({{ items.length }})</h2>
                    <button class="btn primary" @click="edit(null)">Novo anúncio</button>
                </div>
                <p v-if="!items.length && !busy" class="hint">Nada cadastrado no painel. Enquanto estiver vazio, o site usa a lista original; ao salvar o primeiro anúncio, o painel passa a valer.</p>
                <ul class="list">
                    <li v-for="item in items" :key="item.id">
                        <button class="row" @click="edit(item)">
                            <b>{{ item.bairro }} · {{ item.tipo }}</b>
                            <span>{{ money(item.valor) }} · {{ item.area }} m² · {{ statusLabel(item.status) }}</span>
                            <small>{{ item.id }}{{ item.place ? '' : ' · sem posição no mapa' }}</small>
                        </button>
                    </li>
                </ul>
            </section>

            <form v-else class="card form" @submit.prevent="save">
                <h2>{{ isNew ? 'Novo anúncio' : 'Editar anúncio' }}</h2>
                <label v-if="isNew">Código (letras minúsculas, números e hífens)<input v-model="form.id" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="ex.: apto-setor-bueno"></label>
                <div class="grid">
                    <label>Tipo<select v-model="form.tipo"><option v-for="t in TYPES" :key="t[0]" :value="t[0]">{{ t[1] }}</option></select></label>
                    <label>Estado<select v-model="form.status"><option v-for="s in STATUS" :key="s[0]" :value="s[0]">{{ s[1] }}</option></select></label>
                    <label>Cidade<input v-model="form.cidade" required></label>
                    <label>Bairro<input v-model="form.bairro" required></label>
                    <label>Condomínio / edifício<input v-model="form.condominio"></label>
                    <label>Valor (R$)<input v-model.number="form.valor" type="number" min="1" step="any" required></label>
                    <label>Condomínio mensal (R$)<input v-model.number="form.valorCondominio" type="number" min="0"></label>
                    <label>Área (m²)<input v-model.number="form.area" type="number" min="1" step="0.01" required></label>
                    <label>Área do terreno (m²)<input v-model.number="form.areaTerreno" type="number" min="0" step="0.01"></label>
                    <label>Quartos<input v-model.number="form.quartos" type="number" min="0" max="99" required></label>
                    <label>Suítes<input v-model.number="form.suites" type="number" min="0" max="99"></label>
                    <label>Vagas<input v-model.number="form.vagas" type="number" min="0" max="99"></label>
                </div>
                <label>Diferenciais (um por linha)<textarea v-model="form.destaques" rows="4" /></label>
                <label>Fotos (um endereço de imagem por linha, https://…)<textarea v-model="form.fotos" rows="3" /></label>
                <fieldset>
                    <legend>Posição no mapa (opcional)</legend>
                    <div class="grid">
                        <label>Latitude<input v-model.number="form.lat" type="number" step="0.000001" placeholder="-16.69"></label>
                        <label>Longitude<input v-model.number="form.lng" type="number" step="0.000001" placeholder="-49.27"></label>
                    </div>
                    <label class="check"><input v-model="form.approx" type="checkbox"> Mostrar só a região (círculo), sem o ponto exato</label>
                    <p class="hint">Dica: no Google Maps, clique com o botão direito no local e copie os dois números.</p>
                </fieldset>
                <div class="bar">
                    <button type="button" class="btn" @click="editing = false">Cancelar</button>
                    <button v-if="!isNew" type="button" class="btn danger" :disabled="busy" @click="remove">Excluir</button>
                    <button class="btn primary" :disabled="busy">{{ busy ? 'Salvando…' : 'Salvar' }}</button>
                </div>
            </form>
        </template>
    </div>
</template>

<style scoped>
.admin { padding: 32px 0 80px; max-width: 860px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 20px; }
.login { max-width: 380px; display: grid; gap: 14px; }
label { display: grid; gap: 4px; font-size: .9rem; font-weight: 600; }
input, select, textarea { font: inherit; font-weight: 400; min-height: 44px; padding: 8px 10px; border: 1px solid #cfc9bb; border-radius: var(--radius-sm); background: #fff; width: 100%; }
textarea { resize: vertical; }
.form { display: grid; gap: 14px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
fieldset { border: 1px solid var(--line); padding: 12px; display: grid; gap: 10px; }
.check { display: flex; align-items: center; gap: 8px; font-weight: 500; }
.check input { width: 20px; min-height: 20px; }
.bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
.list { list-style: none; padding: 0; display: grid; gap: 8px; }
.row { display: grid; gap: 2px; width: 100%; text-align: left; padding: 12px 14px; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius-sm); font: inherit; cursor: pointer; }
.row:hover { background: var(--brand-soft); }
.row small, .hint { color: #6b6a63; }
.msg { padding: 10px 12px; border-radius: var(--radius-sm); background: var(--brand-soft); }
.msg.bad { background: #f6dcd8; color: #7a1f14; }
.btn.danger { border-color: #a63a2c; color: #a63a2c; }
</style>

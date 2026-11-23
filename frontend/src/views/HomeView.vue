<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { listingsApi } from '@/api/client'
import { setSeo } from '@/composables/useSeo'
import { SITE, whatsappLink } from '@/config'
import { ALL_SLUG, CATEGORIES } from '@/utils/categories'
import type { CategoryKey, Facets, ListingCard as Card } from '@/types/Listing'
import CardSkeleton from '@/components/CardSkeleton.vue'
import ListingCard from '@/components/ListingCard.vue'

const router = useRouter()

const featured = ref<Card[]>([])
const facets = ref<Facets | null>(null)
const covers = ref<Partial<Record<CategoryKey, { cover: string | null, total: number }>>>({})
const loading = ref(true)
const failed = ref(false)

const form = ref({ q: '', suites: '', max: '' })

const MAIN = CATEGORIES.filter(category => category.key !== 'used')
const opportunities = CATEGORIES.find(category => category.key === 'used')!

const neighborhoods = computed(() => (facets.value?.neighborhoods ?? []).slice().sort((a, b) => b.total - a.total || a.neighborhood.localeCompare(b.neighborhood)).slice(0, 8))
const consultMessage = `Olá! Vim pelo site da ${SITE.name} e gostaria de conversar com um consultor.`

function submit() {
    const query: Record<string, string> = {}
    if (form.value.q.trim()) query.busca = form.value.q.trim()
    if (form.value.suites) query.suites = form.value.suites
    if (form.value.max) query.max = form.value.max
    router.push({ path: `/${ALL_SLUG}`, query })
}

onMounted(async () => {
    setSeo({
        title: '',
        description: 'Uma seleção de imóveis para o seu próximo capítulo: prontos para morar, lançamentos, obras em andamento e oportunidades de mercado em Goiânia e região.',
        path: '/',
        jsonLd: { '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: SITE.name, url: SITE.url, telephone: '+55 62 99832-2361', identifier: `CRECI ${SITE.creci}`, employee: { '@type': 'Person', name: SITE.consultant } }
    })

    try {
        const [highlighted, options, ...byCategory] = await Promise.all([
            listingsApi.list({ featured: true, perPage: 6 }),
            listingsApi.facets(),
            ...CATEGORIES.map(category => listingsApi.list({ category: category.key, perPage: 1 }))
        ])
        featured.value = highlighted.data.length ? highlighted.data : (await listingsApi.list({ perPage: 3 })).data
        facets.value = options
        CATEGORIES.forEach((category, index) => {
            covers.value[category.key] = { cover: byCategory[index].data[0]?.cover ?? null, total: byCategory[index].pagination.total }
        })
    } catch {
        failed.value = true
    } finally {
        loading.value = false
    }
})
</script>

<template>
    <div>
        <section class="hero">
            <img class="bg" src="/img/abertura.jpg" alt="Fachada de edifício residencial ao entardecer" fetchpriority="high" width="1280" height="1600">
            <div class="scrim" />
            <div class="container inner">
                <p class="eyebrow">Goiânia e região</p>
                <h1>Uma seleção de imóveis para o seu próximo capítulo.</h1>
                <p class="lead">Localização, arquitetura e escolhas alinhadas ao seu momento de vida.</p>
                <div class="cta">
                    <RouterLink :to="`/${ALL_SLUG}`" class="btn light">Explorar imóveis</RouterLink>
                    <a class="btn ghost-light" :href="whatsappLink(consultMessage)" target="_blank" rel="noopener">Conversar com um consultor</a>
                </div>
            </div>
        </section>

        <div class="container">
            <form class="search" role="search" @submit.prevent="submit">
                <label class="f wide"><span>Bairro, cidade ou nome</span><input v-model="form.q" type="search" enterkeyhint="search" placeholder="Ex.: Setor Marista"></label>
                <label class="f"><span>Suítes</span>
                    <select v-model="form.suites"><option value="">Qualquer</option><option value="2">2 ou mais</option><option value="3">3 ou mais</option><option value="4">4 ou mais</option></select>
                </label>
                <label class="f"><span>Valor até</span>
                    <select v-model="form.max"><option value="">Qualquer</option><option value="1000000">R$ 1 milhão</option><option value="2000000">R$ 2 milhões</option><option value="3000000">R$ 3 milhões</option></select>
                </label>
                <button type="submit" class="btn primary go">Buscar</button>
            </form>

            <section class="section" aria-labelledby="caminhos">
                <p class="eyebrow">Como você quer começar</p>
                <h2 id="caminhos">Três caminhos, a mesma clareza.</h2>
                <div class="cats">
                    <RouterLink v-for="category in MAIN" :key="category.key" :to="`/${category.slug}`" class="cat">
                        <div class="photo"><img v-if="covers[category.key]?.cover" :src="covers[category.key]!.cover!" :alt="category.label" loading="lazy" width="640" height="480"><span v-else>{{ category.label }}</span></div>
                        <h3>{{ category.label }}</h3>
                        <p>{{ category.description }}</p>
                        <span v-if="covers[category.key] && covers[category.key]!.total === 0" class="soon">Sem imóveis no momento. Peça uma seleção personalizada.</span>
                        <span v-else class="go-link">Ver {{ covers[category.key] ? `${covers[category.key]!.total} ${covers[category.key]!.total === 1 ? 'imóvel' : 'imóveis'}` : 'imóveis' }} →</span>
                    </RouterLink>
                </div>
                <RouterLink :to="`/${opportunities.slug}`" class="band">
                    <div>
                        <p class="eyebrow">{{ opportunities.label }}</p>
                        <p class="band-text">{{ opportunities.description }}</p>
                    </div>
                    <span class="go-link">Ver {{ covers.used ? covers.used.total : '' }} {{ covers.used?.total === 1 ? 'oportunidade' : 'oportunidades' }} →</span>
                </RouterLink>
            </section>

            <section class="section" aria-labelledby="selecao">
                <div class="section-head">
                    <div>
                        <p class="eyebrow">Seleção</p>
                        <h2 id="selecao">Imóveis para conhecer primeiro.</h2>
                    </div>
                    <RouterLink :to="`/${ALL_SLUG}`">Ver todos os imóveis</RouterLink>
                </div>
                <p class="intro">Só aparece o que está cadastrado: área, suítes, vagas e valor. Quando uma informação não está disponível, ela não é exibida.</p>
                <div v-if="loading" class="grid"><CardSkeleton v-for="n in 3" :key="n" /></div>
                <p v-else-if="failed" class="notice" role="alert">Não conseguimos carregar os imóveis agora. Tente novamente em instantes ou fale com um consultor pelo WhatsApp.</p>
                <div v-else-if="featured.length" class="grid"><ListingCard v-for="(item, i) in featured" :key="item.id" :listing="item" :eager="i === 0" /></div>
                <p v-else class="muted">Nenhum imóvel em destaque agora. <a :href="whatsappLink(consultMessage)" target="_blank" rel="noopener" class="under">Peça uma seleção personalizada.</a></p>
            </section>

            <section v-if="neighborhoods.length" class="section hoods" aria-labelledby="bairros">
                <div class="side">
                    <p class="eyebrow">Bairros</p>
                    <h2 id="bairros">Comece pela região que você já escolheu.</h2>
                    <p class="intro">Apenas bairros com imóveis cadastrados hoje; a lista acompanha o catálogo.</p>
                </div>
                <ul>
                    <li v-for="item in neighborhoods" :key="`${item.city}-${item.neighborhood}`">
                        <RouterLink :to="{ path: `/${ALL_SLUG}`, query: { cidade: item.city, bairro: item.neighborhood } }">
                            <b>{{ item.neighborhood }}</b><span>{{ item.total }} {{ item.total === 1 ? 'imóvel' : 'imóveis' }}</span>
                        </RouterLink>
                    </li>
                </ul>
            </section>
        </div>

        <section id="atendimento" class="care">
            <div class="container care-in">
                <div>
                    <p class="eyebrow">Atendimento</p>
                    <h2>Orientação antes da visita, clareza antes da decisão.</h2>
                    <p class="care-text">Um consultor ajuda a comparar localização, projeto, entrega e condições, e confirma disponibilidade e documentação de cada imóvel antes de qualquer proposta.</p>
                </div>
                <div class="who">
                    <p class="name">{{ SITE.consultant }}</p>
                    <p class="creci">Consultor imobiliário · CRECI {{ SITE.creci }}</p>
                    <p class="phone">WhatsApp {{ SITE.phone }}</p>
                    <div class="care-cta">
                        <a class="btn light" :href="whatsappLink(consultMessage)" target="_blank" rel="noopener">Conversar com um consultor</a>
                        <a class="btn ghost-light" :href="whatsappLink('Olá! Gostaria de receber uma seleção personalizada de imóveis.')" target="_blank" rel="noopener">Receber seleção personalizada</a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.hero { position: relative; min-height: 600px; display: flex; align-items: flex-end; color: var(--bg); overflow: hidden; background: var(--brand-dark); }
.bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 40%; }
.scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(38, 43, 41, .25) 0%, rgba(38, 43, 41, .12) 35%, rgba(38, 43, 41, .8) 100%); }
.inner { position: relative; padding-top: 80px; padding-bottom: 104px; }
.hero .eyebrow { color: #eae5da; }
h1 { max-width: 14ch; margin-top: 16px; font-size: clamp(2.3rem, 8vw, 4.3rem); line-height: 1.04; font-weight: 400; letter-spacing: -.02em; }
.lead { margin-top: 18px; max-width: 34ch; font-size: 1.1rem; line-height: 1.55; color: #eae5da; }
.cta { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 12px; }
.search { position: relative; margin-top: -56px; display: grid; gap: 14px; padding: 20px; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); grid-template-columns: 1fr 1fr; }
.f { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.f.wide { grid-column: 1 / -1; }
.f span { font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; font-weight: 600; color: var(--ink-3); }
.f input, .f select { height: 48px; padding: 0 12px; border: 1px solid #cfc9bb; border-radius: var(--radius-sm); background: var(--bg); font-size: 1rem; color: var(--ink); width: 100%; }
.go { grid-column: 1 / -1; }
.section h2 { margin-top: 10px; font-size: clamp(1.8rem, 5vw, 2.75rem); line-height: 1.1; }
.section { padding-top: 72px; }
.section-head { align-items: flex-end; flex-wrap: wrap; margin-bottom: 0; }
.intro { margin-top: 14px; max-width: 58ch; color: var(--ink-3); line-height: 1.6; }
.cats { margin-top: 32px; display: grid; gap: 36px; }
.cat { display: block; }
.photo { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #d9d3c5; display: grid; place-items: center; color: var(--ink-3); }
.photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.cat h3 { margin-top: 18px; font-size: 1.75rem; }
.cat p { margin-top: 8px; color: var(--ink-3); line-height: 1.55; }
.go-link { display: inline-block; margin-top: 14px; font-weight: 600; font-size: .94rem; color: var(--brand); }
.soon { display: inline-block; margin-top: 14px; font-size: .9rem; color: var(--ink-3); }
.band { margin-top: 40px; display: flex; flex-direction: column; gap: 6px; padding: 28px 24px; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.band-text { margin-top: 8px; max-width: 60ch; color: var(--ink-2); line-height: 1.55; }
.band .go-link { margin-top: 8px; }
.grid { margin-top: 32px; }
.under { text-decoration: underline; text-underline-offset: 4px; }
.hoods { display: grid; gap: 28px; }
.hoods ul { list-style: none; margin: 0; padding: 0; }
.hoods li a { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding: 20px 0; border-top: 1px solid var(--line); }
.hoods li:last-child a { border-bottom: 1px solid var(--line); }
.hoods li b { font-family: var(--serif); font-weight: 500; font-size: 1.6rem; }
.hoods li span { font-size: .9rem; color: var(--ink-3); }
.hoods li a:hover b { color: var(--brand); text-decoration: underline; text-decoration-color: var(--sand); text-underline-offset: 6px; }
.care { margin-top: 96px; padding: 72px 0; background: var(--brand); color: var(--bg); }
.care .eyebrow { color: var(--sand); }
.care h2 { margin-top: 12px; max-width: 18ch; font-size: clamp(1.9rem, 5vw, 2.9rem); line-height: 1.1; color: var(--bg); }
.care-text { margin-top: 18px; max-width: 50ch; line-height: 1.65; color: #e4dfd3; }
.care-in { display: grid; gap: 40px; }
.who { padding-top: 24px; border-top: 1px solid #3a6158; }
.name { font-family: var(--serif); font-size: 1.7rem; }
.creci { margin-top: 6px; color: var(--sand); }
.phone { margin-top: 4px; color: #e4dfd3; }
.care-cta { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 12px; }
@media (min-width: 760px) {
    .hero { min-height: 680px; }
    .inner { padding-bottom: 128px; }
    .search { grid-template-columns: 2fr 1fr 1fr auto; align-items: end; padding: 22px 24px; margin-top: -48px; }
    .f.wide { grid-column: auto; }
    .go { grid-column: auto; min-width: 150px; }
    .cats { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 32px; }
    .band { flex-direction: row; align-items: center; justify-content: space-between; }
    .section { padding-top: 112px; }
    .hoods { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 80px; align-items: start; }
    .care { padding: 96px 0; }
    .care-in { grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); gap: 80px; align-items: center; }
}
</style>

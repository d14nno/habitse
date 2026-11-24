<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { listingsApi } from '@/api/client'
import { setSeo } from '@/composables/useSeo'
import { SITE, whatsappLink } from '@/config'
import { ALL_SLUG, CATEGORIES } from '@/utils/categories'
import type { HeroSlide } from '@/api/staticCatalog'
import type { CategoryKey, Facets, ListingCard as Card } from '@/types/Listing'
import CardSkeleton from '@/components/CardSkeleton.vue'
import HeroCarousel from '@/components/HeroCarousel.vue'
import ListingCard from '@/components/ListingCard.vue'
import UpgradeSheet from '@/components/UpgradeSheet.vue'

/** O mapa (Leaflet) é um pedaço de código à parte: só é baixado quando a seção "Bairros" é montada */
const MiniMap = defineAsyncComponent(() => import('@/components/MiniMap.vue'))

const router = useRouter()

const featured = ref<Card[]>([])
const slides = ref<HeroSlide[]>([])
const facets = ref<Facets | null>(null)
const covers = ref<Partial<Record<CategoryKey, { cover: string | null, total: number }>>>({})
const loading = ref(true)
const failed = ref(false)

const form = ref({ q: '', suites: '', max: '' })


const neighborhoods = computed(() => (facets.value?.neighborhoods ?? []).slice().sort((a, b) => b.total - a.total || a.neighborhood.localeCompare(b.neighborhood)).slice(0, 8))
const consultMessage = `Olá! Vim pelo site da ${SITE.name} e gostaria de conversar com um consultor.`
const upgradeOpen = ref(false)

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
        jsonLd: { '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: SITE.name, url: SITE.url, telephone: '+55 62 99832-2361', identifier: `CRECI ${SITE.creci}`, sameAs: Object.values(SITE.social).filter(Boolean), employee: { '@type': 'Person', name: SITE.consultant } }
    })

    // A abertura não espera o resto: a foto fixa já está na tela
    listingsApi.hero().then(list => { slides.value = list }).catch(() => undefined)

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
            <HeroCarousel :slides="slides" first="/img/abertura.jpg" first-alt="Fachada de edifício residencial ao entardecer" />
            <div class="scrim" />
            <div class="container inner">
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
                <h2 id="caminhos">Categorias</h2>
                <div class="cats">
                    <RouterLink v-for="category in CATEGORIES" :key="category.key" :to="`/${category.slug}`" class="cat">
                        <div class="photo"><img v-if="covers[category.key]?.cover" :src="covers[category.key]!.cover!" :alt="category.label" loading="lazy" width="640" height="480"><span v-else>{{ category.label }}</span></div>
                        <h3>{{ category.label }}</h3>
                        <span class="go-link">{{ covers[category.key] ? (covers[category.key]!.total ? `${covers[category.key]!.total} ${covers[category.key]!.total === 1 ? 'imóvel' : 'imóveis'}` : 'Sem imóveis no momento') : 'Ver imóveis' }} →</span>
                    </RouterLink>
                </div>
            </section>

            <section class="section" aria-labelledby="selecao">
                <div class="section-head">
                    <h2 id="selecao">Seleção</h2>
                    <RouterLink :to="`/${ALL_SLUG}`">Ver todos</RouterLink>
                </div>
                <div v-if="loading" class="grid"><CardSkeleton v-for="n in 3" :key="n" /></div>
                <p v-else-if="failed" class="notice" role="alert">Não conseguimos carregar os imóveis agora. Tente novamente em instantes ou fale com um consultor pelo WhatsApp.</p>
                <div v-else-if="featured.length" class="grid"><ListingCard v-for="(item, i) in featured" :key="item.id" :listing="item" :eager="i === 0" /></div>
                <p v-else class="muted">Nenhum imóvel em destaque agora. <a :href="whatsappLink(consultMessage)" target="_blank" rel="noopener" class="under">Peça uma seleção personalizada.</a></p>
            </section>

            <section class="section" aria-labelledby="upgrade">
                <div class="upgrade">
                    <div>
                        <h2 id="upgrade">Quer fazer um upgrade no seu imóvel?</h2>
                        <p>Use o seu imóvel como parte do pagamento. Preencha os dados do imóvel e envie pelo WhatsApp: um consultor faz uma análise inicial e apresenta as opções que fazem sentido para você.</p>
                    </div>
                    <button type="button" class="btn primary" @click="upgradeOpen = true">Avaliar meu imóvel</button>
                </div>
            </section>

            <section v-if="neighborhoods.length" class="section hoods" aria-labelledby="bairros">
                <div class="side">
                    <h2 id="bairros">Bairros</h2>
                    <MiniMap />
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

        <UpgradeSheet :open="upgradeOpen" @close="upgradeOpen = false" />

        <section id="atendimento" class="care">
            <div class="container care-in">
                <div>
                    <h2>Atendimento com orientação.</h2>
                    <p class="care-text">Comparamos localização, projeto, entrega e condições, e confirmamos disponibilidade e documentação antes de qualquer proposta.</p>
                </div>
                <div class="who">
                    <p class="name">{{ SITE.consultant }}</p>
                    <p class="creci">Consultor imobiliário · CRECI {{ SITE.creci }}</p>
                    <p class="phone">WhatsApp {{ SITE.phone }}</p>
                    <div class="care-cta">
                        <a class="btn light" :href="whatsappLink(consultMessage)" target="_blank" rel="noopener">Conversar com um consultor</a>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.hero { position: relative; min-height: 600px; display: flex; align-items: flex-end; color: var(--bg); overflow: hidden; isolation: isolate; background: var(--brand-dark); }
.scrim { position: absolute; inset: 0; z-index: 1; pointer-events: none; background: linear-gradient(180deg, rgba(38, 43, 41, .25) 0%, rgba(38, 43, 41, .12) 35%, rgba(38, 43, 41, .8) 100%); }
.inner { position: relative; z-index: 2; padding-top: 80px; padding-bottom: 104px; }
.hero .eyebrow { color: #eae5da; }
h1 { max-width: 14ch; margin-top: 16px; font-size: clamp(2.3rem, 8vw, 4.3rem); line-height: 1.04; font-weight: 400; letter-spacing: -.02em; }
.lead { margin-top: 18px; max-width: 34ch; font-size: 1.1rem; line-height: 1.55; color: #eae5da; }
.cta { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 12px; }
.search { position: relative; z-index: 2; margin-top: -56px; display: grid; gap: 14px; padding: 20px; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); grid-template-columns: 1fr 1fr; }
.f { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.f.wide { grid-column: 1 / -1; }
.f span { font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; font-weight: 600; color: var(--ink-3); }
.f input, .f select { height: 48px; padding: 0 12px; border: 1px solid #cfc9bb; border-radius: var(--radius-sm); background: var(--bg); font-size: 1rem; color: var(--ink); width: 100%; }
.go { grid-column: 1 / -1; }
.section h2 { margin-top: 0; font-size: clamp(1.8rem, 5vw, 2.75rem); line-height: 1.1; }
.section { padding-top: 72px; }
.section-head { align-items: flex-end; flex-wrap: wrap; margin-bottom: 0; }
.cats { margin-top: 28px; display: grid; gap: 28px; grid-template-columns: 1fr 1fr; }
.cat { display: block; }
.photo { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #d9d3c5; display: grid; place-items: center; color: var(--ink-3); }
.photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.cat h3 { margin-top: 16px; font-size: 1.5rem; }
.go-link { display: inline-block; margin-top: 8px; font-weight: 600; font-size: .94rem; color: var(--brand); }
.grid { margin-top: 28px; }
.under { text-decoration: underline; text-underline-offset: 4px; }
.upgrade { display: grid; gap: 20px; padding: 28px 24px; border: 1px solid var(--line); border-left: 3px solid var(--sand); background: var(--card); border-radius: var(--radius); }
.upgrade h2 { font-size: clamp(1.5rem, 4vw, 2.1rem); line-height: 1.15; }
.upgrade p { margin-top: 10px; max-width: 60ch; color: var(--ink-3); line-height: 1.6; }
.hoods { display: grid; gap: 20px; }
.hoods ul { list-style: none; margin: 0; padding: 0; }
.hoods li a { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding: 20px 0; border-top: 1px solid var(--line); }
.hoods li:last-child a { border-bottom: 1px solid var(--line); }
.hoods li b { font-family: var(--serif); font-weight: 500; font-size: 1.6rem; }
.hoods li span { font-size: .9rem; color: var(--ink-3); }
.hoods li a:hover b { color: var(--brand); text-decoration: underline; text-decoration-color: var(--sand); text-underline-offset: 6px; }
.care { margin-top: 80px; padding: 64px 0; background: var(--brand); color: var(--bg); }
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
    .cats { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }
        .section { padding-top: 96px; }
    .upgrade { grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 48px; padding: 36px 40px; }
    .hoods { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 80px; align-items: start; }
    .care { padding: 96px 0; }
    .care-in { grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); gap: 80px; align-items: center; }
}
</style>

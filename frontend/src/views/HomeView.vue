<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import { listingsApi } from '@/api/client'
import { setSeo } from '@/composables/useSeo'
import { SITE } from '@/config'
import { CATEGORIES } from '@/utils/categories'
import type { Facets, ListingCard as Card } from '@/types/Listing'
import AppIcon from '@/components/AppIcon.vue'
import CardSkeleton from '@/components/CardSkeleton.vue'
import ListingCard from '@/components/ListingCard.vue'

const router = useRouter()

const featured = ref<Card[]>([])
const facets = ref<Facets | null>(null)
const loading = ref(true)
const failed = ref(false)
const query = ref('')

const ICONS: Record<string, string> = { used: 'key', off_plan: 'blueprint', under_construction: 'crane' }
const totalOf = (key: string) => facets.value?.categories.find(item => item.category === key)?.total ?? null

function submit() {
    const busca = query.value.trim()
    // Busca livre sempre parte das 3 vitrines juntas; a primeira com resultado é a de usados (mais procurada)
    router.push({ path: '/usados', query: busca ? { busca } : {} })
}

onMounted(async () => {
    setSeo({
        title: '',
        description: 'Imóveis usados, na planta e em construção em Goiás. Veja fotos, valores e previsão de entrega e fale direto no WhatsApp.',
        path: '/',
        jsonLd: { '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: SITE.name, url: SITE.url, telephone: '+55 62 99832-2361', identifier: `CRECI ${SITE.creci}` }
    })
    try {
        const [list, options] = await Promise.all([listingsApi.list({ featured: true, perPage: 8 }), listingsApi.facets()])
        featured.value = list.data
        facets.value = options
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
            <div class="container">
                <h1>Seu próximo imóvel, <span>do jeito que você precisa</span></h1>
                <p>Usados, na planta e em construção. Fotos, valores e prazos claros, e atendimento direto no WhatsApp.</p>
                <form class="search" role="search" @submit.prevent="submit">
                    <AppIcon name="search" />
                    <input v-model="query" type="search" inputmode="search" enterkeyhint="search" placeholder="Bairro, cidade ou construtora" aria-label="Buscar imóveis">
                    <button type="submit" class="btn primary">Buscar</button>
                </form>
            </div>
        </section>

        <div class="container">
            <section class="section" aria-label="Categorias">
                <div class="cats">
                    <RouterLink v-for="category in CATEGORIES" :key="category.key" :to="`/${category.slug}`" class="cat" :style="{ '--c': category.color }">
                        <span class="ci"><AppIcon :name="ICONS[category.key]" :size="26" /></span>
                        <span class="ct">
                            <b>{{ category.label }}</b>
                            <small>{{ category.headline }}<template v-if="totalOf(category.key) !== null"> · {{ totalOf(category.key) }} imóveis</template></small>
                        </span>
                        <AppIcon name="chevron" :size="20" />
                    </RouterLink>
                </div>
            </section>

            <section class="section" aria-labelledby="destaques">
                <div class="section-head"><h2 id="destaques">Destaques</h2></div>
                <div v-if="loading" class="rail"><CardSkeleton v-for="n in 3" :key="n" /></div>
                <p v-else-if="failed" class="notice" role="alert">Não conseguimos carregar os imóveis agora. Tente novamente em instantes.</p>
                <div v-else-if="featured.length" class="rail">
                    <ListingCard v-for="(item, i) in featured" :key="item.id" :listing="item" :eager="i === 0" />
                </div>
                <p v-else class="muted">Em breve novos destaques por aqui.</p>
            </section>

            <section class="section why" aria-labelledby="porque">
                <div class="section-head"><h2 id="porque">Por que a Habitse</h2></div>
                <ul>
                    <li><AppIcon name="check" /> <span><b>Informação completa</b> Valores, metragem, previsão de entrega e andamento da obra.</span></li>
                    <li><AppIcon name="check" /> <span><b>Atendimento humano</b> Tire dúvidas e agende visita pelo WhatsApp.</span></li>
                    <li><AppIcon name="check" /> <span><b>Três jeitos de comprar</b> Pronto para morar, lançamento ou obra em andamento.</span></li>
                </ul>
            </section>
        </div>
    </div>
</template>

<style scoped>
.hero { padding: 28px 0 30px; background: linear-gradient(160deg, #0b6b5d, #0a4d6b); color: #fff; }
h1 { font-size: clamp(1.7rem, 6.5vw, 2.8rem); line-height: 1.12; letter-spacing: -.03em; max-width: 18ch; }
h1 span { color: #ffd68a; }
.hero p { margin-top: 12px; max-width: 46ch; color: #d8ece8; }
.search { display: flex; align-items: center; gap: 6px; margin-top: 22px; max-width: 640px; padding: 6px 6px 6px 14px; border-radius: 16px; background: #fff; color: var(--ink-3); box-shadow: 0 10px 30px rgba(0, 0, 0, .22); }
.search input { flex: 1; min-width: 0; height: 46px; border: 0; outline: 0; background: transparent; color: var(--ink); font-size: 1rem; }
.search .btn { min-height: 46px; }
.cats { display: grid; gap: 12px; margin-top: -26px; }
.cat { position: relative; display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: var(--radius); background: #fff; box-shadow: var(--shadow); border-left: 5px solid var(--c); transition: transform .12s ease; }
.cat:active { transform: scale(.985); }
.ci { width: 50px; height: 50px; flex: none; display: grid; place-items: center; border-radius: 14px; color: var(--c); background: color-mix(in srgb, var(--c) 12%, white); }
.ct { flex: 1; display: grid; gap: 2px; }
.ct b { font-size: 1.05rem; }
.ct small { color: var(--ink-3); font-size: .85rem; }
.cat > :last-child { color: var(--ink-3); }
.why ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.why li { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: var(--radius-sm); background: #fff; }
.why li > svg { flex: none; margin-top: 2px; color: var(--brand); }
.why b { display: block; }
.why span { color: var(--ink-2); font-size: .94rem; }
@media (min-width: 760px) {
    .hero { padding: 56px 0 64px; }
    .cats { grid-template-columns: repeat(3, 1fr); margin-top: -34px; }
    .why ul { grid-template-columns: repeat(3, 1fr); }
    .rail > * { width: 300px; }
}
</style>

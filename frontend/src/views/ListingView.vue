<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError, listingsApi } from '@/api/client'
import { SITE, whatsappLink } from '@/config'
import { setSeo } from '@/composables/useSeo'
import { useFavorites } from '@/composables/useFavorites'
import { categoryByKey, typeLabel } from '@/utils/categories'
import { count, formatArea, formatDelivery, formatPrice } from '@/utils/format'
import type { ListingDetail } from '@/types/Listing'
import AppIcon from '@/components/AppIcon.vue'
import ListingCard from '@/components/ListingCard.vue'
import PhotoGallery from '@/components/PhotoGallery.vue'
import ProgressBar from '@/components/ProgressBar.vue'

const route = useRoute()
const router = useRouter()
const favorites = useFavorites()

const listing = ref<ListingDetail | null>(null)
const loading = ref(true)
const error = ref('')
const notFound = ref(false)
const expanded = ref(false)
const shared = ref('')

const category = computed(() => (listing.value ? categoryByKey(listing.value.category) : null))
const delivery = computed(() => formatDelivery(listing.value?.deliveryDate))
const url = computed(() => `${SITE.url}/imovel/${listing.value?.slug ?? ''}`)
const message = computed(() => `Olá! Tenho interesse no imóvel "${listing.value?.title}" (${formatPrice(listing.value?.price)}). ${url.value}`)
const longText = computed(() => (listing.value?.description.length ?? 0) > 360)

/** Características principais em "blocos" fáceis de ler no celular */
const facts = computed(() => {
    const item = listing.value
    if (!item) return []
    const list: { icon: string, label: string, value: string }[] = []
    if (item.bedrooms) list.push({ icon: 'bed', label: 'Quartos', value: item.suites ? `${item.bedrooms} (${count(item.suites, 'suíte')})` : String(item.bedrooms) })
    if (item.bathrooms) list.push({ icon: 'bath', label: 'Banheiros', value: String(item.bathrooms) })
    if (item.parking) list.push({ icon: 'car', label: 'Vagas', value: String(item.parking) })
    const area = formatArea(item.area)
    if (area) list.push({ icon: 'area', label: 'Área', value: area })
    if (delivery.value) list.push({ icon: 'calendar', label: 'Entrega', value: delivery.value })
    return list
})

async function load(slug: string) {
    loading.value = true
    error.value = ''
    notFound.value = false
    expanded.value = false
    try {
        listing.value = await listingsApi.get(slug)
        const item = listing.value
        setSeo({
            title: item.title,
            description: `${typeLabel(item.type)} em ${item.neighborhood}, ${item.city}. ${formatPrice(item.price)}. ${item.description.split('\n')[0]}`.slice(0, 300),
            path: `/imovel/${item.slug}`,
            image: item.cover,
            jsonLd: {
                '@context': 'https://schema.org',
                '@type': 'RealEstateListing',
                name: item.title,
                url: `${SITE.url}/imovel/${item.slug}`,
                image: item.photos.map(photo => (photo.startsWith('http') ? photo : `${SITE.url}${photo}`)),
                description: item.description,
                ...(item.price !== null ? { offers: { '@type': 'Offer', price: item.price, priceCurrency: 'BRL' } } : {}),
                contentLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressLocality: item.city, addressRegion: item.state, addressCountry: 'BR' } }
            }
        })
    } catch (e) {
        listing.value = null
        if (e instanceof ApiError && e.status === 404) notFound.value = true
        else error.value = e instanceof ApiError ? e.message : 'Não foi possível carregar agora.'
    } finally {
        loading.value = false
    }
}

async function share() {
    const item = listing.value
    if (!item) return
    try {
        if (navigator.share) await navigator.share({ title: item.title, text: `${item.title} — ${formatPrice(item.price)}`, url: url.value })
        else {
            await navigator.clipboard.writeText(url.value)
            shared.value = 'Link copiado!'
            setTimeout(() => { shared.value = '' }, 2200)
        }
    } catch {
        // A pessoa fechou o compartilhamento: nada a fazer
    }
}

const back = () => (window.history.length > 1 ? router.back() : router.push(category.value ? `/${category.value.slug}` : '/'))

watch(() => route.params.slug, slug => { if (slug && route.name === 'listing') load(String(slug)) }, { immediate: true })
</script>

<template>
    <div v-if="loading" class="container load" aria-busy="true"><div class="skeleton big" /><div class="skeleton" style="height: 30px; width: 50%" /><div class="skeleton" style="height: 18px; width: 80%" /></div>

    <div v-else-if="notFound" class="container state">
        <h1>Imóvel não encontrado</h1>
        <p>Ele pode ter sido vendido ou saído do ar.</p>
        <RouterLink to="/" class="btn primary">Ver outros imóveis</RouterLink>
    </div>

    <div v-else-if="error" class="container state">
        <p class="notice" role="alert">{{ error }}</p>
        <button type="button" class="btn primary" @click="load(String(route.params.slug))">Tentar de novo</button>
    </div>

    <article v-else-if="listing && category" class="detail">
        <div class="media">
            <button type="button" class="round back" aria-label="Voltar" @click="back"><AppIcon name="chevron" :size="22" /></button>
            <div class="actions">
                <button type="button" class="round" aria-label="Compartilhar" @click="share"><AppIcon name="share" :size="21" /></button>
                <button type="button" class="round" :class="{ on: favorites.has(listing.slug) }" :aria-pressed="favorites.has(listing.slug)" :aria-label="favorites.has(listing.slug) ? 'Remover dos favoritos' : 'Salvar nos favoritos'" @click="favorites.toggle(listing.slug)"><AppIcon name="heart" :size="22" /></button>
            </div>
            <PhotoGallery :photos="listing.photos" :title="listing.title" />
            <p v-if="shared" class="toast" role="status">{{ shared }}</p>
        </div>

        <div class="container body">
            <span class="badge" :class="listing.category">{{ listing.categoryLabel }}</span>
            <span v-if="listing.permuta" class="badge permuta">Permuta Bambuí</span>
            <p class="price"><small v-if="listing.category !== 'used' && listing.price !== null">A partir de</small>{{ formatPrice(listing.price) }}</p>
            <p v-if="listing.priceNote" class="price-note">{{ listing.priceNote }}</p>
            <h1>{{ listing.title }}</h1>
            <p class="where"><AppIcon name="pin" :size="17" /> {{ listing.address || `${listing.neighborhood}, ${listing.city} - ${listing.state}` }}</p>

            <ul v-if="facts.length" class="facts">
                <li v-for="fact in facts" :key="fact.label"><AppIcon :name="fact.icon" :size="22" /><b>{{ fact.value }}</b><small>{{ fact.label }}</small></li>
            </ul>

            <section v-if="listing.category !== 'used'" class="block build">
                <h2>{{ listing.category === 'under_construction' ? 'Andamento da obra' : 'Lançamento' }}</h2>
                <ProgressBar v-if="listing.constructionProgress !== null" :value="listing.constructionProgress" />
                <p v-if="delivery">Previsão de entrega: <b>{{ delivery }}</b></p>
                <p v-if="listing.developer">Construtora/Incorporadora: <b>{{ listing.developer }}</b></p>
                <p v-if="listing.incorporation">Registro de incorporação: <b>{{ listing.incorporation }}</b></p>
            </section>

            <section class="block">
                <h2>Sobre o imóvel</h2>
                <p class="desc" :class="{ clamp: longText && !expanded }">{{ listing.description }}</p>
                <button v-if="longText" type="button" class="more" @click="expanded = !expanded">{{ expanded ? 'Ver menos' : 'Ler mais' }}</button>
            </section>

            <section v-if="listing.features.length" class="block">
                <h2>Diferenciais</h2>
                <ul class="features"><li v-for="feature in listing.features" :key="feature"><AppIcon name="check" :size="18" /> {{ feature }}</li></ul>
            </section>

            <section v-if="listing.related.length" class="block">
                <div class="section-head"><h2>Veja também</h2><RouterLink :to="`/${category.slug}`">Ver todos</RouterLink></div>
                <div class="rail"><ListingCard v-for="item in listing.related" :key="item.id" :listing="item" /></div>
            </section>
        </div>

        <!-- Barra de contato fixa: o botão principal sempre ao alcance do polegar -->
        <div class="cta">
            <div class="cta-price"><small>{{ listing.category === 'used' ? 'Valor' : 'A partir de' }}</small><b>{{ formatPrice(listing.price) }}</b></div>
            <a class="btn wa grow" :href="whatsappLink(message)" target="_blank" rel="noopener"><AppIcon name="whatsapp" :size="22" /> Falar no WhatsApp</a>
        </div>
    </article>
</template>

<style scoped>
.load { display: grid; gap: 14px; padding-top: 0; }
.big { aspect-ratio: 4 / 3; border-radius: 0; margin: 0 -16px; }
.state { display: grid; justify-items: start; gap: 12px; padding-top: 40px; }
.state h1 { font-size: 1.4rem; }
.media { position: relative; }
.round { position: absolute; top: 12px; z-index: 5; width: 44px; height: 44px; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .94); color: var(--ink); box-shadow: 0 2px 10px rgba(0, 0, 0, .2); }
.round.on { color: #e11d48; }
.round.on :deep(path) { fill: currentColor; }
.back { left: 12px; transform: scaleX(-1); }
.actions { position: absolute; top: 0; right: 0; z-index: 5; display: flex; gap: 8px; padding-right: 12px; }
.actions .round { position: static; margin-top: 12px; }
.toast { position: absolute; left: 50%; bottom: 44px; z-index: 6; transform: translateX(-50%); padding: 8px 14px; border-radius: 99px; background: rgba(16, 32, 29, .92); color: #fff; font-size: .88rem; font-weight: 600; }
.body { padding-top: 16px; padding-bottom: calc(var(--nav-h) + 70px); }
.price { margin-top: 8px; font-size: 1.9rem; font-weight: 800; letter-spacing: -.03em; }
.price small { display: block; font-size: .85rem; font-weight: 600; letter-spacing: 0; color: var(--ink-3); }
.price-note { margin-top: 2px; font-size: .82rem; color: var(--ink-3); }
.badge.permuta { margin-left: 6px; background: #10201d; color: #fff; }
h1 { margin-top: 2px; font-size: 1.2rem; line-height: 1.3; }
.where { margin-top: 8px; display: flex; align-items: center; gap: 6px; color: var(--ink-2); }
.facts { list-style: none; margin: 18px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(92px, 1fr)); gap: 10px; }
.facts li { display: grid; justify-items: center; gap: 3px; padding: 12px 6px; border-radius: var(--radius-sm); background: #fff; text-align: center; color: var(--brand); }
.facts b { color: var(--ink); font-size: .98rem; }
.facts small { color: var(--ink-3); font-size: .76rem; }
.block { margin-top: 24px; }
.block h2 { margin-bottom: 8px; font-size: 1.1rem; }
.build { padding: 16px; border-radius: var(--radius); background: #fff; }
.build p { margin-top: 8px; color: var(--ink-2); }
.desc { white-space: pre-line; color: var(--ink-2); }
.desc.clamp { display: -webkit-box; -webkit-line-clamp: 5; line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
.more { margin-top: 6px; min-height: 40px; padding: 0; border: 0; background: none; font-weight: 700; color: var(--brand); }
.features { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
.features li { display: flex; align-items: center; gap: 7px; color: var(--ink-2); font-size: .94rem; }
.features svg { color: var(--brand); flex: none; }
.cta { position: fixed; left: 0; right: 0; bottom: calc(var(--nav-h) + var(--safe-bottom)); z-index: 45; display: flex; align-items: center; gap: 12px; padding: 10px 16px; background: rgba(255, 255, 255, .97); border-top: 1px solid var(--line); box-shadow: 0 -6px 20px rgba(16, 32, 29, .08); }
.cta-price { display: grid; line-height: 1.15; }
.cta-price small { color: var(--ink-3); font-size: .72rem; }
.cta-price b { font-size: 1.05rem; }
.grow { flex: 1; }
@media (min-width: 900px) {
    .detail { max-width: 1180px; margin: 0 auto; padding: 20px 24px 0; display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); grid-template-rows: auto 1fr; gap: 0 28px; align-items: start; }
    .media { grid-column: 1; grid-row: 1 / span 2; position: sticky; top: calc(var(--header-h) + 20px); }
    .cta { position: static; grid-column: 2; grid-row: 1; margin-bottom: 8px; border: 1px solid var(--line); border-radius: var(--radius); box-shadow: var(--shadow); }
    .body { grid-column: 2; grid-row: 2; padding: 0 0 40px; }
    .back, .actions { display: none; }
}
</style>

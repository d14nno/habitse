import { createRouter, createWebHistory } from 'vue-router'

import { ALL_SLUG, categoryBySlug } from '@/utils/categories'

/** Rotas carregadas sob demanda: o celular baixa só o código da tela que abre */
export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
        // Endereço antigo da vitrine de usados: agora é "Oportunidades de mercado"
        { path: '/usados', redirect: { name: 'category', params: { category: 'oportunidades' } } },
        { path: `/${ALL_SLUG}`, name: 'all', component: () => import('@/views/CategoryView.vue') },
        {
            path: '/:category(prontos-para-morar|na-planta|em-construcao|oportunidades)',
            name: 'category',
            component: () => import('@/views/CategoryView.vue'),
            // Rota inválida nunca chega aqui (o regex acima já filtra), mas mantém o tipo seguro
            beforeEnter: to => (categoryBySlug(String(to.params.category)) ? true : { name: 'not-found' })
        },
        { path: '/imovel/:slug', name: 'listing', component: () => import('@/views/ListingView.vue') },
        { path: '/mapa', name: 'map', component: () => import('@/views/MapView.vue') },
        { path: '/favoritos', name: 'favorites', component: () => import('@/views/FavoritesView.vue') },
        { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') }
    ],
    scrollBehavior(to, from, saved) {
        // Voltar devolve a posição de rolagem (lista → imóvel → voltar); nova página começa no topo
        if (saved) return saved
        if (to.name === from.name && (to.name === 'category' || to.name === 'all')) return false
        return { top: 0 }
    }
})

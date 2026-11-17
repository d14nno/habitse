/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Endereço da API (ex.: https://api.habitse.com.br). Vazio em desenvolvimento: usa o proxy /api */
    readonly VITE_API_URL?: string
    /** WhatsApp de atendimento, só dígitos com código do país (ex.: 5562999999999) */
    readonly VITE_WHATSAPP?: string
    /** CRECI do responsável (ex.: 49.743/GO) */
    readonly VITE_CRECI?: string
    /** Endereço público do site (links compartilhados e SEO) */
    readonly VITE_SITE_URL?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<object, object, unknown>
    export default component
}

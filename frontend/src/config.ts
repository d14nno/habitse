/** Configurações do site (variáveis VITE_* no build) */
export const SITE = {
    name: 'Habitse',
    domain: 'habitse.com.br',
    url: (import.meta.env.VITE_SITE_URL || 'https://habitse.com.br').replace(/\/$/, ''),
    /** WhatsApp de atendimento (somente dígitos, com 55). Pode ser trocado em VITE_WHATSAPP */
    whatsapp: import.meta.env.VITE_WHATSAPP || '5562998322361',
    /** Registro profissional exibido no rodapé e nos dados estruturados */
    creci: import.meta.env.VITE_CRECI || '49.743/GO',
    /** Em desenvolvimento usa o proxy do Vite (/api); em produção, a API do subdomínio */
    api: (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'https://api.habitse.com.br')).replace(/\/$/, '')
}

export const whatsappLink = (message: string) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`

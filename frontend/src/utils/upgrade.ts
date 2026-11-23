import { formatPrice } from '@/utils/format'

/** Dados que o cliente informa sobre o imóvel que quer usar como parte do pagamento (análise inicial, sem documentos) */
export interface UpgradeForm {
    type: string
    neighborhood: string
    city: string
    building: string
    area: string
    bedrooms: string
    suites: string
    parking: string
    status: '' | 'quitado' | 'financiado' | 'debitos' | 'outra'
    statusDetail: string
    price: string
    interest: string
    notes: string
    name: string
}

export const EMPTY_UPGRADE: UpgradeForm = {
    type: 'Apartamento', neighborhood: '', city: 'Goiânia', building: '', area: '', bedrooms: '', suites: '', parking: '', status: '', statusDetail: '', price: '', interest: '', notes: '', name: ''
}

export const UPGRADE_TYPES = ['Apartamento', 'Casa', 'Casa em condomínio', 'Cobertura', 'Terreno', 'Sala comercial']

export const UPGRADE_STATUS: { value: Exclude<UpgradeForm['status'], ''>, label: string, detailLabel?: string }[] = [
    { value: 'quitado', label: 'Quitado' },
    { value: 'financiado', label: 'Financiado', detailLabel: 'Saldo devedor aproximado (opcional)' },
    { value: 'debitos', label: 'Com débitos (IPTU, condomínio)', detailLabel: 'Quais débitos e valor aproximado (opcional)' },
    { value: 'outra', label: 'Outra situação', detailLabel: 'Conte a situação' }
]

const STATUS_TEXT: Record<Exclude<UpgradeForm['status'], ''>, string> = { quitado: 'Quitado', financiado: 'Financiado', debitos: 'Com débitos (IPTU/condomínio)', outra: 'Outra situação' }

const clean = (text: string, max = 300) => text.replace(/\s+/g, ' ').trim().slice(0, max)

/** "650.000", "R$ 650 mil"... → só os dígitos como número; vazio ou inválido vira null */
export function parseMoney(text: string): number | null {
    const digits = text.replace(/\D/g, '')

    return digits ? Number(digits) : null
}

export function parseCount(text: string): number | null {
    const value = Number(text)

    return text.trim() !== '' && Number.isInteger(value) && value >= 0 && value < 100 ? value : null
}

export function parseArea(text: string): number | null {
    const value = Number(text.replace(',', '.'))

    return text.trim() !== '' && Number.isFinite(value) && value > 0 && value < 100000 ? value : null
}

/** Erros em português, um por campo obrigatório (nome, bairro e tipo) */
export function validateUpgrade(form: UpgradeForm): Record<string, string> {
    const errors: Record<string, string> = {}

    if (!form.type) errors.type = 'Escolha o tipo do imóvel.'
    if (!clean(form.neighborhood)) errors.neighborhood = 'Informe o bairro.'
    if (!clean(form.name)) errors.name = 'Informe seu nome.'
    if (form.area.trim() && parseArea(form.area) === null) errors.area = 'Use só números (ex.: 98).'

    return errors
}

/** Mensagem pronta para o WhatsApp; só entra o que foi preenchido */
export function buildUpgradeMessage(form: UpgradeForm): string {
    const place = [clean(form.neighborhood, 80), clean(form.city, 60)].filter(Boolean).join(', ')
    const building = clean(form.building, 80)
    const area = parseArea(form.area)
    const rooms = [
        parseCount(form.bedrooms) !== null ? `Quartos: ${parseCount(form.bedrooms)}` : '',
        parseCount(form.suites) !== null ? `Suítes: ${parseCount(form.suites)}` : '',
        parseCount(form.parking) !== null ? `Vagas: ${parseCount(form.parking)}` : ''
    ].filter(Boolean).join(' · ')
    const price = parseMoney(form.price)
    const status = form.status ? `${STATUS_TEXT[form.status]}${clean(form.statusDetail, 160) ? ` (${clean(form.statusDetail, 160)})` : ''}` : ''

    const lines = [
        'Olá! Quero avaliar o meu imóvel para um upgrade (análise inicial).',
        '',
        '*Imóvel*',
        `Tipo: ${form.type}`,
        place ? `Localização: ${place}${building ? ` (${building})` : ''}` : '',
        area !== null ? `Área privativa: ${area.toLocaleString('pt-BR')} m²` : '',
        rooms,
        status ? `Situação: ${status}` : '',
        price !== null ? `Valor pretendido: ${formatPrice(price).replace(/\s/g, ' ')}` : '',
        clean(form.interest, 120) ? `Tenho interesse em: ${clean(form.interest, 120)}` : '',
        clean(form.notes, 400) ? `Observações: ${clean(form.notes, 400)}` : '',
        '',
        `Nome: ${clean(form.name, 80)}`
    ]

    return lines.filter((line, index) => line !== '' || (index > 0 && lines[index - 1] !== '')).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

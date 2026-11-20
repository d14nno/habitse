/**
 * Leitura das páginas de empreendimento do site da Bambuí (bambui.com.br/lancamento/<nome>/), para o Habitse
 * anunciar os empreendimentos da própria construtora. Funções puras: recebem o HTML e devolvem os dados; quem busca a
 * página e grava no banco é `BambuiImportService`.
 *
 * O que a página não informa (preço, registro de incorporação, previsão de entrega, quartos de alguns) fica como
 * `null`: nada é inventado.
 */

export type BambuiStatus = 'upcoming' | 'under_construction' | 'ready'

export interface BambuiRange { min: number, max: number }

export interface BambuiProject {
    /** Último trecho do endereço da página (ex.: "areiao-1141") */
    slug: string
    sourceUrl: string
    name: string
    status: BambuiStatus | null
    /** Frase de destaque ("A 300m do Bosque dos Buritis") */
    tagline: string | null
    description: string
    /** Metragem privativa (mínima e máxima) */
    area: BambuiRange | null
    bedrooms: BambuiRange | null
    suites: BambuiRange | null
    parking: BambuiRange | null
    /** Endereço como está na página */
    address: string | null
    zip: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
    /** Obra concluída, em % (só quando a página tem o "Acompanhamento da obra") */
    progress: number | null
    /** "outubro de 2026" ou "agosto de 2026", como a página informa */
    progressDate: string | null
    latitude: number | null
    longitude: number | null
    /** Fotos por grupo da galeria: Fachada, Apartamento, Lazer, Serviços, Plantas */
    gallery: Record<string, string[]>
}

const STATUS_LABELS: [RegExp, BambuiStatus][] = [
    [/^breve lan[çc]amento$/i, 'upcoming'], [/^lan[çc]amento$/i, 'upcoming'],
    [/^obras?\s+iniciadas?$/i, 'under_construction'], [/^em\s+obras?$/i, 'under_construction'], [/^em\s+constru[çc][ãa]o$/i, 'under_construction'],
    [/^pronto\s+para\s+morar$/i, 'ready']
]

const decodeEntities = (text: string) => text
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code))).replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))

/** Pedaços de texto visíveis da página, na ordem em que aparecem */
export function textTokens(html: string): string[] {
    const clean = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, '')

    return decodeEntities(clean.replace(/<[^>]+>/g, '|')).split('|').map(token => token.replace(/\s+/g, ' ').trim()).filter(Boolean)
}

const number = (text: string) => Number(text.replace(/\./g, '').replace(',', '.'))

/** "57, 78 e 94" · "118 a 252" · "2 ou 3" · "130" · "78,24" → números (vírgula só separa quando vem seguida de espaço) */
function numberList(text: string): number[] | null {
    const pieces = text.trim().split(/\s*(?:,\s+|\s+e\s+|\s+a\s+|\s+ou\s+|\s+até\s+|\s+-\s+)\s*/i)
    const numbers = pieces.map(piece => (/^\d+(?:\.\d{3})*(?:,\d+)?$/.test(piece) ? number(piece) : NaN))

    return numbers.length && numbers.every(Number.isFinite) ? numbers : null
}

const rangeOf = (numbers: number[]): BambuiRange => ({ min: Math.min(...numbers), max: Math.max(...numbers) })

/** "78 e 115m²", "57, 78 e 94m²", "118 a 252m²", "130m²" */
function parseAreaRange(token: string): BambuiRange | null {
    const match = token.match(/^(.+?)\s*m²$/i)
    const numbers = match ? numberList(match[1]) : null

    return numbers && numbers.every(value => value >= 10 && value <= 5000) ? rangeOf(numbers) : null
}

/** "3 Suítes", "2 e 3 Quartos", "1, 2 e 3 Suítes", "1 ou 2 vagas" */
function parseCount(token: string, word: RegExp): BambuiRange | null {
    const match = token.match(new RegExp(`^(.+?)\\s*${word.source}$`, 'i'))
    const numbers = match ? numberList(match[1]) : null

    return numbers && numbers.every(value => Number.isInteger(value) && value >= 0 && value <= 30) ? rangeOf(numbers) : null
}

/** "R. C-238, Q 541 - Jardim America, Goiânia - GO, 74290-150" → bairro, cidade, UF, CEP */
export function parseAddress(address: string): { zip: string | null, neighborhood: string | null, city: string | null, state: string | null } {
    const zip = address.match(/\b(\d{5}-\d{3})\b/)?.[1] ?? null
    const cityMatch = address.match(/(?:^|[\s,-])(Goi[âa]nia|Aparecida de Goi[âa]nia|Senador Canedo|Trindade|An[áa]polis)\s*(?:-\s*|\/\s*)?(GO)?\b/i)
    const city = cityMatch ? titleCase(cityMatch[1]).replace(/Goiania/i, 'Goiânia') : null
    const state = cityMatch ? (cityMatch[2] ?? 'GO').toUpperCase() : null

    let neighborhood: string | null = null

    if (cityMatch && cityMatch.index !== undefined) {
        // O bairro é o último trecho antes da cidade: "... - Jardim America, Goiânia", "St. Marista Goiânia", "SETOR MARISTA - GOIÂNIA"
        const before = address.slice(0, cityMatch.index).replace(/[\s,-]+$/, '')
        const parts = before.split(/\s+-\s+|,\s*/).map(part => part.trim()).filter(Boolean)
        const last = parts[parts.length - 1] ?? ''

        // O trecho do bairro costuma começar por Setor/St./Jardim/Parque/Vila...; sem isso, ainda é o último pedaço
        neighborhood = last && !/^\d/.test(last) ? last : null
    }

    if (neighborhood) {
        neighborhood = neighborhood.replace(/^St\.?\s+/i, 'Setor ')
        if (neighborhood === neighborhood.toUpperCase()) neighborhood = titleCase(neighborhood)
    }

    return { zip, neighborhood, city, state }
}

/** Preserva siglas e números; o resto em minúsculas com a inicial maiúscula (nomes de bairro e de rua) */
export function titleCase(text: string): string {
    const small = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'com'])

    return text.trim().toLowerCase().replace(/\S+/g, (word, offset) => {
        if (offset > 0 && small.has(word)) return word
        if (/^[a-z]?-?\d+[a-z]?$/.test(word) || /^[a-z]-\d+$/.test(word)) return word.toUpperCase()

        return word.charAt(0).toUpperCase() + word.slice(1)
    })
}

/** Texto em CAIXA ALTA vira frase normal, mantendo como estão os nomes próprios informados em `keep` */
export function sentenceCase(text: string, keep: string[] = []): string {
    const letters = text.replace(/[^A-Za-zÀ-ÿ]/g, '')
    if (!letters || letters !== letters.toUpperCase()) return text.trim()

    let result = text.trim().toLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (_, start, letter) => `${start}${letter.toUpperCase()}`)

    // Códigos como "c-232" e nomes de lugares ("praça c-232", "parque areião", "av. ricardo paranhos") voltam com maiúsculas
    const capital = (word: string) => (/^[a-z]{1,2}-?\d+[a-z]?$/.test(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1))
    result = result.replace(/\b(pra[çc]a|parque|bosque|setor|av\.|avenida|rua|alameda|col[ée]gio|shopping)(\s+(?:d[aeo]s?\s+)?[\p{L}\d][\p{L}\d-]*)(\s+(?:d[aeo]s?\s+)?[\p{L}][\p{L}-]*)?/giu, (_, place: string, first: string, second?: string) => {
        const cap = (chunk: string) => chunk.replace(/[\p{L}\d][\p{L}\d-]*/gu, word => (/^d[aeo]s?$/.test(word) ? word : capital(word)))

        return `${capital(place.toLowerCase())}${cap(first)}${second && !/^\s+(?:e|ou|a|à|no|na|do|da)\b/i.test(second) ? cap(second) : second ?? ''}`
    })

    for (const name of keep.filter(Boolean)) result = result.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), name)

    return result
}

function parseGallery(html: string): Record<string, string[]> {
    const gallery: Record<string, string[]> = {}
    const start = html.search(/>\s*Galerias\s*</i)
    if (start < 0) return gallery

    const section = html.slice(start)
    // Cada grupo abre com o rótulo (Fachada, Apartamento…) e segue com os links das fotos até o próximo rótulo
    const marker = /<div class="font-15 font-b-5">([^<]+)<\/div>/g
    const labels = Array.from(section.matchAll(marker)).map(match => ({ label: decodeEntities(match[1]).trim(), index: match.index ?? 0 }))

    labels.forEach((item, position) => {
        const end = position + 1 < labels.length ? labels[position + 1].index : section.length
        // Antes do 1º rótulo do grupo está o link da 1ª foto (o rótulo fica dentro do link): recua até o `<a href` anterior
        const begin = section.lastIndexOf('<a href=', item.index)
        const chunk = section.slice(begin >= 0 ? begin : item.index, position + 1 < labels.length ? section.lastIndexOf('<a href=', end) : end)
        const urls = Array.from(chunk.matchAll(/<a href="(https?:\/\/[^"]+\/wp-content\/uploads\/[^"]+\.(?:jpe?g|png|webp))"/gi)).map(match => match[1])

        gallery[item.label] = Array.from(new Set([...(gallery[item.label] ?? []), ...urls]))
    })

    return gallery
}

/** Lê uma página de empreendimento; null se não parecer uma (sem nome ou sem status reconhecível) */
export function parseBambuiPage(html: string, sourceUrl: string): BambuiProject | null {
    const tokens = textTokens(html)
    const statusIndex = tokens.findIndex(token => STATUS_LABELS.some(([pattern]) => pattern.test(token)))
    if (statusIndex < 0) return null

    const status = STATUS_LABELS.find(([pattern]) => pattern.test(tokens[statusIndex]))?.[1] ?? null
    const endOffset = tokens.slice(statusIndex + 1).findIndex(token => /^(Tour Virtual|Galerias|Cadastre-se e?)$/i.test(token))
    const header = tokens.slice(statusIndex + 1, endOffset < 0 ? statusIndex + 12 : statusIndex + 1 + endOffset)

    let area: BambuiRange | null = null
    let bedrooms: BambuiRange | null = null
    let suites: BambuiRange | null = null
    let parking: BambuiRange | null = null
    const texts: string[] = []

    for (const token of header) {
        area ??= parseAreaRange(token)
        const isArea = parseAreaRange(token) !== null
        const beds = parseCount(token, /quartos?/)
        const suit = parseCount(token, /su[ií]tes?/)
        const spots = parseCount(token, /vagas?/)

        if (beds) bedrooms ??= beds
        else if (suit) suites ??= suit
        else if (spots) parking ??= spots
        else if (!isArea) texts.push(token)
    }

    // Nome em caixa alta aparece duas vezes (AREIÃO 1141 / Areião 1141): fica a versão normal, uma só
    const distinct = texts.filter((text, index) => texts.findIndex(other => other.toLowerCase() === text.toLowerCase()) === index)
    const first = distinct[0] ?? ''
    if (!first) return null

    const mixed = texts.find(text => text.toLowerCase() === first.toLowerCase() && text !== text.toUpperCase())
    const name = mixed ?? (first === first.toUpperCase() ? titleCase(first) : first)

    const rest = distinct.slice(1)
    const tagline = rest.find(text => text.length <= 90) ?? null
    const description = rest.filter(text => text !== tagline).join('\n\n')

    // Endereço: o texto logo depois de "Escolas" (fim do bloco "bares, clínicas, compras…"); na página mais antiga está em CAIXA ALTA com CEP
    const afterSchools = tokens[tokens.findIndex(token => token === 'Escolas') + 1]
    const looksLikeAddress = (text: string | undefined) => !!text && /(\bR\.|\bRua|\bAv\.?|\bAvenida|\bAlameda|\bQd|\bQuadra|CEP|\d{5}-\d{3})/i.test(text) && text.length < 200
    const address = [afterSchools, ...tokens.filter(token => /^(RUA|AV|AVENIDA|ALAMEDA)\b.*CEP/i.test(token))].find(looksLikeAddress) ?? null
    const place = address ? parseAddress(address) : { zip: null, neighborhood: null, city: null, state: null }

    const doneIndex = tokens.findIndex(token => /^conclu[ií]do$/i.test(token))
    const doneToken = doneIndex >= 0 ? tokens[doneIndex + 1] : undefined
    const progress = doneToken && /^\d{1,3}(?:,\d+)?%$/.test(doneToken) ? Number(doneToken.replace('%', '').replace(',', '.')) : null
    const progressDate = tokens.find(token => /^(Atualizado em )?(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro) de \d{4}$/i.test(token))?.replace(/^Atualizado em /i, '') ?? null

    const coords = html.match(/waze\.com\/ul\?ll=(-?\d+(?:\.\d+)?)(?:%2C|,)(-?\d+(?:\.\d+)?)/i)

    return {
        slug: sourceUrl.replace(/\/+$/, '').split('/').pop() ?? '',
        sourceUrl,
        name,
        status,
        tagline,
        description,
        area,
        bedrooms,
        suites,
        parking,
        address,
        zip: place.zip,
        neighborhood: place.neighborhood,
        city: place.city,
        state: place.state,
        progress,
        progressDate,
        latitude: coords ? Number(coords[1]) : null,
        longitude: coords ? Number(coords[2]) : null,
        gallery: parseGallery(html)
    }
}

/** Endereços das páginas de empreendimento a partir da página de lista (/lancamentos) */
export function discoverProjectUrls(html: string, base = 'https://bambui.com.br'): string[] {
    const urls = Array.from(html.matchAll(/href="((?:https?:\/\/(?:www\.)?bambui\.com\.br)?\/lancamento\/[a-z0-9-]+\/?)"/gi)).map(match => {
        const href = match[1]

        return (href.startsWith('http') ? href : `${base}${href}`).replace(/\/?$/, '/')
    })

    return Array.from(new Set(urls))
}

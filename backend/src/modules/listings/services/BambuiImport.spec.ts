import { InMemoryListingRepository } from '../infra/InMemoryListingRepository'
import { Listing } from '../entities/Listing'
import { ListingCategory } from '../enums/ListingCategory'
import { discoverProjectUrls, parseAddress, parseBambuiPage, sentenceCase, textTokens, titleCase } from './BambuiParser'
import { BambuiImportService, tidyAddress, toListing } from './BambuiImportService'

const UP = 'https://bambui.com.br/wp-content/uploads/2026/06'

/** HTML mínimo com a mesma estrutura das páginas reais de empreendimento da Bambuí */
function page(options: { status: string, name: string, upperName?: string, tagline?: string, description?: string, facts: string[], address: string, progress?: string, gallery?: Record<string, string[]>, waze?: string }) {
    const gallery = options.gallery ?? { Fachada: [`${UP}/01-FACHADA-800x1000.jpg`, `${UP}/02-FACHADA-700x1000.jpg`], Apartamento: [`${UP}/31-DECORADO-1499x1000.jpg`], Lazer: [`${UP}/07-PISCINA-1800x1000.jpg`, `${UP}/23-ACADEMIA-3287x1000.jpg`, `${UP}/27-SAUNA-700x1000.jpg`], Plantas: [`${UP}/36-PLANTA-1800x1000.jpg`] }
    const groups = Object.entries(gallery).map(([label, urls]) => `<div><div class="ps-4"><a href="${urls[0]}" data-fancybox="images"><div class="d-relative"><div class="d-flex cta-6"><div class="font-15 font-b-5">${label}</div></div></div></a></div>${urls.slice(1).map(url => `<a href="${url}" data-fancybox="images" title="x"></a>`).join('')}</div>`).join('')

    return `<html><head><title>Bambuí | ${options.name}</title><script>var x = "BREVE LANÇAMENTO"</script></head><body>
    <div class="header"><span>${options.status}</span><h1>${options.upperName ?? options.name}</h1><h2>${options.name}</h2>
    ${options.tagline ? `<p>${options.tagline}</p>` : ''}${options.description ? `<p>${options.description}</p>` : ''}
    ${options.facts.map(fact => `<div><span>${fact}</span></div>`).join('')}</div>
    <h2>Tour Virtual</h2><h2>Galerias</h2><div class="slider-galeria-interno">${groups}</div>
    <div><span>Bares e restaurantes</span><span>Clínicas e hospitais</span><span>Compras</span><span>Entretenimento</span><span>Escolas</span><p>${options.address}</p></div>
    ${options.progress ? `<h3>Acompanhamento</h3><h3>da obra</h3><p>Atualizado em outubro de 2026</p><span>Status</span><span>Concluído</span><span>${options.progress}</span>` : ''}
    <a href="https://www.waze.com/ul?ll=${options.waze ?? '-16.7015%2C-49.2545'}&navigate=yes">Waze</a>
    <p>A Bambuí nasceu há mais de 30 anos</p></body></html>`
}

const OBRA = page({ status: 'OBRA INICIADA', upperName: 'PRAÇA 232', name: 'Praça 232', tagline: 'VISTA DEFINITIVA PARA A PRAÇA C-232', description: 'O NOVO APARECE EM CADA UMA DAS ESCOLHAS, DO PAISAGISMO AOS DETALHES.', facts: ['151 e 157m²', '3 Suítes'], address: 'R. C-237, 156 - Jardim América, Goiânia - GO, 74290-140', progress: '36,52%', waze: '-16.7078%2C-49.2774' })
const LANCAMENTO = page({ status: 'BREVE LANÇAMENTO', upperName: 'AREIÃO 1141', name: 'Areião 1141', description: 'PLENO DE SENTIDO. METRAGENS RARAS NO MARISTA COM LAZER PENSADO PARA IMPRESSIONAR.', facts: ['78 e 115m²', '2 e 3 Suítes'], address: 'RUA 1141, QUADRA 253, LOTE 38/40, SETOR MARISTA - GOIÂNIA-GO - CEP: 74180-081' })
const PRONTO = page({ status: 'PRONTO PARA MORAR', name: 'B.Great Bosque dos Buritis', tagline: 'A 300m do Bosque dos Buritis', description: 'Após o sucesso do B.Great Nova Suíça, chegou o B.Great Bosque dos Buritis.', facts: ['57, 78 e 94m²', '1, 2 e 3 Quartos', '1, 2 e 3 Suítes', '1 ou 2 vagas'], address: 'Rua 29 com rua 31 Qd 83 Lt 20-1, 24 e 26, nº 162, Setor Central - Goiânia - GO', progress: '99,71%' })

describe('leitura das páginas da Bambuí', () => {
    it('empreendimento em obra: situação, nome sem caixa alta, metragens, suítes, endereço, andamento e coordenadas', () => {
        const project = parseBambuiPage(OBRA, 'https://bambui.com.br/lancamento/praca-232/')

        expect(project).toMatchObject({
            slug: 'praca-232', name: 'Praça 232', status: 'under_construction', tagline: 'VISTA DEFINITIVA PARA A PRAÇA C-232',
            area: { min: 151, max: 157 }, suites: { min: 3, max: 3 }, bedrooms: null, parking: null,
            zip: '74290-140', neighborhood: 'Jardim América', city: 'Goiânia', state: 'GO', progress: 36.52, progressDate: 'outubro de 2026',
            latitude: -16.7078, longitude: -49.2774
        })
    })

    it('lançamento (endereço em caixa alta com CEP) e pronto (listas "57, 78 e 94m²" e "1 ou 2 vagas")', () => {
        const launch = parseBambuiPage(LANCAMENTO, 'https://bambui.com.br/lancamento/areiao-1141/')
        expect(launch).toMatchObject({ name: 'Areião 1141', status: 'upcoming', zip: '74180-081', neighborhood: 'Setor Marista', city: 'Goiânia', area: { min: 78, max: 115 }, suites: { min: 2, max: 3 }, progress: null })

        const ready = parseBambuiPage(PRONTO, 'https://bambui.com.br/lancamento/b-great-bosque-dos-buritis/')
        expect(ready).toMatchObject({ status: 'ready', area: { min: 57, max: 94 }, bedrooms: { min: 1, max: 3 }, suites: { min: 1, max: 3 }, parking: { min: 1, max: 2 }, neighborhood: 'Setor Central', progress: 99.71 })
    })

    it('galeria por grupo: fachada, apartamento, lazer e plantas, sem misturar os grupos', () => {
        const { gallery } = parseBambuiPage(OBRA, 'https://bambui.com.br/lancamento/praca-232/') as NonNullable<ReturnType<typeof parseBambuiPage>>

        expect(Object.keys(gallery)).toEqual(['Fachada', 'Apartamento', 'Lazer', 'Plantas'])
        expect(gallery.Fachada).toEqual([`${UP}/01-FACHADA-800x1000.jpg`, `${UP}/02-FACHADA-700x1000.jpg`])
        expect(gallery.Lazer).toHaveLength(3)
        expect(gallery.Plantas).toEqual([`${UP}/36-PLANTA-1800x1000.jpg`])
    })

    it('página que não é de empreendimento é ignorada', () => {
        expect(parseBambuiPage('<html><body><h1>Blog</h1><p>Texto</p></body></html>', 'https://bambui.com.br/blog/')).toBeNull()
    })

    it('descobre as páginas de empreendimento na lista, sem repetir', () => {
        const html = '<a href="https://bambui.com.br/lancamento/areiao-1141/">A</a><a href="/lancamento/praca-232">B</a><a href="https://bambui.com.br/lancamento/areiao-1141">A</a><a href="/blog">C</a>'

        expect(discoverProjectUrls(html)).toEqual(['https://bambui.com.br/lancamento/areiao-1141/', 'https://bambui.com.br/lancamento/praca-232/'])
    })

    it('apoios de texto: endereço, caixa alta e entidades', () => {
        expect(parseAddress('R. 1143 Q 262, 481 - St. Marista Goiânia - GO 74180-200')).toMatchObject({ zip: '74180-200', neighborhood: 'Setor Marista', city: 'Goiânia', state: 'GO' })
        expect(titleCase('SETOR MARISTA')).toBe('Setor Marista')
        expect(titleCase('RUA C-237, QUADRA 12')).toBe('Rua C-237, Quadra 12')
        expect(sentenceCase('PLENO DE SENTIDO. CONHEÇA O AREIÃO 1141.', ['Areião 1141'])).toBe('Pleno de sentido. Conheça o Areião 1141.')
        expect(sentenceCase('Texto já em caixa mista.')).toBe('Texto já em caixa mista.')
        expect(textTokens('<p>A &amp; B</p><script>x</script><p> C </p>')).toEqual(['A & B', 'C'])
        expect(tidyAddress('RUA 1141, QUADRA 253, LOTE 38/40, SETOR MARISTA - GOIÂNIA-GO - CEP: 74180-081')).toBe('Rua 1141, Quadra 253, Lote 38/40, Setor Marista')
        expect(tidyAddress('R. 1143 Q 262, 481 - St. Marista Goiânia - GO 74180-200')).toBe('R. 1143 Q 262, 481 - Setor Marista')
        expect(tidyAddress('R. C-237, 156 - Jardim América, Goiânia - GO, 74290-140')).toBe('R. C-237, 156 - Jardim América')
    })
})

describe('anúncio montado a partir do empreendimento', () => {
    it('em obra: categoria "em construção", andamento arredondado, suítes no título e preço sob consulta', () => {
        const { listing, missing } = toListing(parseBambuiPage(OBRA, 'https://bambui.com.br/lancamento/praca-232/') as never)

        expect(listing.props).toMatchObject({
            slug: 'praca-232', title: 'Praça 232 — 3 suítes', category: ListingCategory.UNDER_CONSTRUCTION, type: 'apartamento', status: 'published', price: null,
            city: 'Goiânia', state: 'GO', neighborhood: 'Jardim América', bedrooms: 3, suites: 3, parking: 0, area: 151, developer: 'Bambuí', constructionProgress: 37, deliveryDate: null
        })
        expect(listing.props.description).toContain('Vista definitiva para a Praça C-232.')
        expect(listing.props.description).toContain('Metragens: 151 a 157 m² · Suítes: 3.')
        expect(listing.props.description).toContain('Obra 36,52% concluída (atualizado em outubro de 2026).')
        expect(listing.props.features).toEqual(['Piscina', 'Sauna', 'Academia'])
        expect(missing).toEqual(expect.arrayContaining(['preço', 'registro de incorporação', 'previsão de entrega', 'vagas']))
    })

    it('lançamento vira "na planta"; pronto para morar fica como rascunho até a pessoa decidir', () => {
        const launch = toListing(parseBambuiPage(LANCAMENTO, 'https://bambui.com.br/lancamento/areiao-1141/') as never).listing
        expect(launch.props).toMatchObject({ category: ListingCategory.OFF_PLAN, status: 'published', title: 'Areião 1141 — 2 e 3 suítes', constructionProgress: null })

        const ready = parseBambuiPage(PRONTO, 'https://bambui.com.br/lancamento/b-great-bosque-dos-buritis/') as never
        expect(toListing(ready).listing.props).toMatchObject({ category: ListingCategory.READY, status: 'draft', parking: 1, bedrooms: 1, suites: 1, deliveryDate: null })
        expect(toListing(ready, { publishReady: true }).listing.props.status).toBe('published')
    })

    it('fotos: fachada, apartamento e lazer primeiro, sem plantas, no máximo 12', () => {
        const many = (prefix: string, total: number) => Array.from({ length: total }, (_, index) => `${UP}/${prefix}-${index}-800x1000.jpg`)
        const html = page({ status: 'OBRA INICIADA', name: 'Muitas Fotos', facts: ['100m²', '2 Suítes'], address: 'Rua A - Setor Marista, Goiânia - GO', gallery: { Fachada: many('F', 6), Apartamento: many('A', 6), Lazer: many('L', 6), 'Serviços': many('S', 6), Plantas: many('P', 6) } })
        const { listing } = toListing(parseBambuiPage(html, 'https://bambui.com.br/lancamento/muitas-fotos/') as never)

        expect(listing.props.photos).toHaveLength(12)
        expect(listing.props.photos.slice(0, 3).every(url => url.includes('/F-'))).toBe(true)
        expect(listing.props.photos.some(url => url.includes('/P-'))).toBe(false)
    })
})

describe('importação (BambuiImportService)', () => {
    const site: Record<string, string> = {
        'https://bambui.com.br/lancamentos': '<a href="/lancamento/areiao-1141/">1</a><a href="/lancamento/praca-232/">2</a><a href="/lancamento/b-great-bosque-dos-buritis/">3</a><a href="/lancamento/quebrado/">4</a>',
        'https://bambui.com.br/lancamento/areiao-1141/': LANCAMENTO,
        'https://bambui.com.br/lancamento/praca-232/': OBRA,
        'https://bambui.com.br/lancamento/b-great-bosque-dos-buritis/': PRONTO,
        'https://bambui.com.br/lancamento/quebrado/': '<html><body>fora do ar</body></html>'
    }
    const fetchPage = async (url: string) => {
        if (!(url in site)) throw new Error(`${url} respondeu 404`)
        return site[url]
    }

    it('cria os empreendimentos, ignora o que não é página de empreendimento e relata o que falta', async () => {
        const repository = new InMemoryListingRepository()
        const outcomes = await new BambuiImportService(repository, fetchPage, 0).run()

        expect(outcomes.map(outcome => [outcome.slug, outcome.action])).toEqual([['areiao-1141', 'created'], ['praca-232', 'created'], ['b-great-bosque-dos-buritis', 'created'], ['quebrado', 'skipped']])
        expect(repository.listings.map(item => [item.slug, item.props.status])).toEqual([['areiao-1141', 'published'], ['praca-232', 'published'], ['b-great-bosque-dos-buritis', 'draft']])
    })

    it('rodar de novo atualiza o conteúdo e preserva preço, destaque e situação ajustados à mão', async () => {
        const repository = new InMemoryListingRepository()
        const service = new BambuiImportService(repository, fetchPage, 0)
        await service.run({ only: ['praca-232'] })

        const [first] = repository.listings
        repository.listings[0] = new Listing({ ...first.props, price: 1450000, featured: true, status: 'sold', title: 'Título editado' })

        site['https://bambui.com.br/lancamento/praca-232/'] = OBRA.replace('36,52%', '40,10%')
        const outcomes = await service.run({ only: ['praca-232'] })

        expect(outcomes[0]).toMatchObject({ action: 'updated' })
        expect(repository.listings).toHaveLength(1)
        expect(repository.listings[0].props).toMatchObject({ price: 1450000, featured: true, status: 'sold', title: 'Praça 232 — 3 suítes', constructionProgress: 40 })
        expect(repository.listings[0].props.description).toContain('40,1% concluída')
    })

    it('simulação não grava nada', async () => {
        const repository = new InMemoryListingRepository()
        const outcomes = await new BambuiImportService(repository, fetchPage, 0).run({ dryRun: true, only: ['areiao-1141'] })

        expect(outcomes).toHaveLength(1)
        expect(repository.listings).toHaveLength(0)
    })
})

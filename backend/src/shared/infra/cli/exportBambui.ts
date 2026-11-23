/* eslint-disable no-console */
/**
 * Gera o catálogo estático dos empreendimentos da Bambuí para o site publicar SEM depender da API/banco do servidor.
 *
 * Uso: npm run export:bambui                (lê bambui.com.br, aplica os ajustes e grava o catálogo e o sitemap)
 *      npm run export:bambui -- --dry-run    (mostra o resultado sem gravar nada)
 *      npm run export:bambui -- --from-dir=<pasta>   (lê páginas já salvas, <slug>.html, em vez do site; para testes ou se o site estiver fora do ar)
 *
 * Grava: frontend/public/data/empreendimentos.json e frontend/public/sitemap.xml
 * Lê:    data/bambui-ajustes.json (preço, registro de incorporação, entrega… editados à mão; nunca sobrescrito)
 *        data/bambui-tabelas.json (preço "a partir de", entrega e registro lidos das tabelas do Drive: `npm run sync:drive`)
 *        data/bambui-permutas.json (imóveis de permuta da Bambuí)
 *        data/bambui-fotos.json (fotos copiadas do Drive para o site: `npm run sync:fotos`)
 *
 * Se alguma página não puder ser lida (site fora do ar, rede), NADA é gravado: o catálogo anterior continua valendo.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

import { InMemoryListingRepository } from '@modules/listings/infra/InMemoryListingRepository'
import { BambuiImportService } from '@modules/listings/services/BambuiImportService'
import { permutaToListing, validatePermutas } from '@modules/listings/services/PermutaCatalog'
import { TableInfos } from '@modules/listings/services/PriceTableSync'
import { adjustmentsFromPhotos, adjustmentsFromTables, buildCatalog, buildSitemap, catalogToJson, Catalog, mergeAdjustments, validateAdjustments } from '@modules/listings/services/StaticCatalog'

const root = path.resolve(process.cwd(), '..')
const flag = (name: string) => process.argv.includes(`--${name}`)
const value = (name: string, fallback: string) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback

const catalogPath = path.resolve(root, value('out', 'frontend/public/data/empreendimentos.json'))
const sitemapPath = path.resolve(root, value('sitemap', 'frontend/public/sitemap.xml'))
const adjustmentsPath = path.resolve(root, value('ajustes', 'data/bambui-ajustes.json'))
const tablesPath = path.resolve(root, value('tabelas', 'data/bambui-tabelas.json'))
const photosPath = path.resolve(root, value('fotos', 'data/bambui-fotos.json'))
const permutasPath = path.resolve(root, value('permutas', 'data/bambui-permutas.json'))
const siteUrl = value('site', 'https://habitse.com.br')

/** Páginas já salvas em disco: a lista (/lancamentos) é montada a partir dos arquivos <slug>.html */
function fetchFromDir(dir: string) {
    return async (url: string): Promise<string> => {
        if (url.replace(/\/$/, '').endsWith('/lancamentos')) {
            return readdirSync(dir).filter(file => file.endsWith('.html')).map(file => `<a href="/lancamento/${file.replace(/\.html$/, '')}/">${file}</a>`).join(' ')
        }

        return readFileSync(path.join(dir, `${url.replace(/\/$/, '').split('/').pop()}.html`), 'utf8')
    }
}

async function fetchPage(url: string): Promise<string> {
    const response = await fetch(url, { headers: { 'User-Agent': 'HabitseImport/1.0 (catálogo dos empreendimentos da própria Bambuí)' } })
    if (!response.ok) throw new Error(`${url} respondeu ${response.status}`)

    return response.text()
}

function readJson(file: string): unknown {
    return JSON.parse(readFileSync(file, 'utf8'))
}

async function main() {
    const { adjustments, errors } = existsSync(adjustmentsPath) ? validateAdjustments(readJson(adjustmentsPath)) : { adjustments: {}, errors: [] as string[] }

    if (errors.length) {
        console.error(`❌ Ajustes inválidos em ${path.relative(root, adjustmentsPath)}:\n${errors.map(error => `   - ${error}`).join('\n')}`)
        process.exit(1)
    }

    const photos = existsSync(photosPath) ? adjustmentsFromPhotos(readJson(photosPath) as Record<string, { file: string }[]>) : {}
    const tables = existsSync(tablesPath) ? (readJson(tablesPath) as TableInfos) : {}

    const permutas = existsSync(permutasPath) ? validatePermutas(readJson(permutasPath)) : { file: null, errors: [] as string[] }
    if (permutas.errors.length) {
        console.error(`❌ Permutas inválidas em ${path.relative(root, permutasPath)}:\n${permutas.errors.map(error => `   - ${error}`).join('\n')}`)
        process.exit(1)
    }

    const sink = new InMemoryListingRepository()
    const fromDir = process.argv.find(arg => arg.startsWith('--from-dir='))?.split('=')[1]
    const outcomes = await new BambuiImportService(sink, fromDir ? fetchFromDir(path.resolve(fromDir)) : fetchPage, fromDir ? 0 : 1000).run()
    const failed = outcomes.filter(outcome => outcome.action === 'skipped' && outcome.failed)

    if (failed.length || sink.listings.length === 0) {
        console.error(`❌ Nada foi gravado: ${failed.length ? `não foi possível ler ${failed.map(outcome => outcome.slug).join(', ')}` : 'nenhum empreendimento encontrado'}. O catálogo anterior continua valendo.`)
        process.exit(1)
    }

    const unknown = Object.keys(adjustments).filter(slug => !sink.listings.some(listing => listing.slug === slug))
    for (const slug of unknown) console.warn(`⚠️  ajuste para "${slug}": esse empreendimento não existe mais no site da Bambuí (ignorado)`)

    const previous: Catalog | null = existsSync(catalogPath) ? (readJson(catalogPath) as Catalog) : null
    const catalog = buildCatalog([...sink.listings, ...(permutas.file?.imoveis ?? []).map(permutaToListing)], mergeAdjustments(mergeAdjustments(photos, adjustmentsFromTables(tables)), adjustments), previous)
    const json = catalogToJson(catalog)
    const sitemap = buildSitemap(catalog, siteUrl)

    for (const item of catalog.items) {
        const pending = item.permuta ? [] : [item.price === null ? 'preço' : '', item.incorporation === null ? 'registro de incorporação' : '', item.deliveryDate === null && item.category !== 'used' && item.category !== 'ready' ? 'previsão de entrega' : ''].filter(Boolean)
        console.log(`✅ ${item.title} [${item.permuta ? 'Permuta' : item.categoryLabel}]${pending.length ? ` — falta: ${pending.join(', ')}` : ''}`)
    }
    const hidden = sink.listings.length - catalog.items.length
    if (hidden > 0) console.log(`ℹ️  ${hidden} empreendimento(s) fora do site (rascunho: prontos para morar). Para publicar, use "status": "published" em ${path.relative(root, adjustmentsPath)}.`)

    const changed = !previous || catalogToJson(previous) !== json

    if (flag('dry-run')) {
        console.log(`\nSimulação: ${catalog.items.length} empreendimento(s) no catálogo${changed ? ' (haveria mudança)' : ' (sem mudança)'}.`)
        return
    }

    mkdirSync(path.dirname(catalogPath), { recursive: true })
    writeFileSync(catalogPath, json)
    writeFileSync(sitemapPath, sitemap)
    console.log(`\n${catalog.items.length} empreendimento(s) em ${path.relative(root, catalogPath)}${changed ? '' : ' (sem mudança)'}.`)
}

main().catch(error => {
    console.error('❌', error instanceof Error ? error.message : error)
    process.exit(1)
})

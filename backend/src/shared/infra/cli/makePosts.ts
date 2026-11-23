/* eslint-disable no-console */
/**
 * Gera os posts do Instagram e do Facebook (carrossel 1080×1350 + legenda) de cada imóvel do catálogo do site.
 *
 * Uso: npm run posts                              (todos os imóveis do catálogo)
 *      npm run posts -- --only=praca-232,vox-home  (só esses)
 *      npm run posts -- --out=posts                (pasta de saída, na raiz do projeto; padrão: posts)
 *
 * Saída: posts/<slug>/01.jpg … (capa com os dados, fotos, fechamento com o contato) e posts/<slug>/legenda.txt.
 * Lê frontend/public/data/empreendimentos.json e as fotos de frontend/public/fotos (rode `npm run export:bambui` antes se
 * o catálogo estiver desatualizado). Precisa do Edge ou do Chrome instalado (ou BROWSER_PATH apontando para o executável).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'
import { chromium } from 'playwright-core'

import { buildCaption, CONTACT, deliveryText, DISCLAIMER, facts, pickSlidePhotos, priceLine, statusLabel } from '@modules/listings/services/SocialPost'
import { Catalog, CatalogItem } from '@modules/listings/services/StaticCatalog'

const root = path.resolve(process.cwd(), '..')
const publicDir = path.join(root, 'frontend/public')
const value = (name: string, fallback: string) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback

const W = 1080
const H = 1350
const GREEN = '#173d36'
const IVORY = '#f5f2eb'
const SAND = '#c4b69e'

const BROWSERS = [
    process.env.BROWSER_PATH ?? '',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
]

const fileUrl = (file: string) => `file:///${file.replace(/\\/g, '/')}`
const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const symbol = (size: number, fg = IVORY) => `<svg width="${size}" height="${size}" viewBox="0 0 40 40"><rect x="5" y="4" width="8" height="32" fill="${fg}"/><rect x="27" y="12" width="8" height="24" fill="${fg}"/><rect x="13" y="19" width="14" height="5" fill="${SAND}"/></svg>`
const logo = `<div class="logo">${symbol(54)}<b>Habitse</b></div>`

const CSS = `
@font-face { font-family: Serif; src: url('${fileUrl(path.join(publicDir, 'fonts/newsreader-latin.woff2'))}'); font-weight: 200 800; }
@font-face { font-family: Sans; src: url('${fileUrl(path.join(publicDir, 'fonts/publicsans-latin.woff2'))}'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${GREEN}; color: ${IVORY}; font-family: Sans, sans-serif; }
.photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.shade { position: absolute; inset: 0; }
.logo { position: absolute; left: 64px; top: 56px; display: flex; align-items: center; gap: 16px; }
.logo b { font-family: Serif, serif; font-size: 46px; font-weight: 600; letter-spacing: -.015em; }
.legal { position: absolute; left: 64px; right: 64px; bottom: 34px; font-size: 21px; opacity: .8; }
.tag { font-size: 24px; letter-spacing: .14em; text-transform: uppercase; color: ${SAND}; font-weight: 600; }
h1 { font-family: Serif, serif; font-weight: 500; line-height: 1.04; letter-spacing: -.02em; }
`

const page = (body: string, extra = '') => `<!doctype html><meta charset="utf-8"><style>${CSS}${extra}</style>${body}`

function coverSlide(item: CatalogItem, photo: string): string {
    const price = priceLine(item)
    const delivery = item.category === 'used' ? null : deliveryText(item.deliveryDate)
    const lead = price?.startsWith('a partir de ') ? ['a partir de', price.replace('a partir de ', '')] : ['', price ?? '']

    return page(`
<img class="photo" src="${fileUrl(photo)}">
<div class="shade" style="background:linear-gradient(180deg,rgba(23,61,54,.55) 0%,rgba(23,61,54,0) 22%,rgba(23,61,54,0) 38%,rgba(14,36,32,.94) 100%)"></div>
${logo}
<div style="position:absolute;left:64px;right:64px;bottom:96px">
  <p class="tag">${esc(statusLabel(item.category))}</p>
  <h1 style="margin-top:18px;font-size:84px">${esc(item.title)}</h1>
  <p style="margin-top:18px;font-size:34px;color:#eae5da">${esc(item.neighborhood)}, ${esc(item.city)}</p>
  <p style="margin-top:20px;font-size:30px;color:#eae5da">${esc([facts(item), delivery ? `Entrega ${delivery}` : ''].filter(Boolean).join(' · '))}</p>
  ${price ? `<p style="margin-top:26px;font-size:26px;color:${SAND}">${lead[0]}</p><h1 style="font-size:78px;margin-top:${lead[0] ? 2 : 26}px">${esc(lead[1])}</h1>` : ''}
</div>
<p class="legal">${esc(DISCLAIMER)}</p>`)
}

function photoSlide(item: CatalogItem, photo: string): string {
    return page(`
<img class="photo" src="${fileUrl(photo)}">
<div class="shade" style="background:linear-gradient(180deg,rgba(14,36,32,.5) 0%,rgba(14,36,32,0) 18%,rgba(14,36,32,0) 80%,rgba(14,36,32,.75) 100%)"></div>
${logo}
<p style="position:absolute;left:64px;bottom:70px;font-family:Serif,serif;font-size:44px;font-weight:500">${esc(item.title)}</p>
<p class="legal" style="bottom:28px">${esc(DISCLAIMER)}</p>`)
}

function closingSlide(item: CatalogItem): string {
    return page(`
<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 90px">
  ${symbol(150)}
  <h1 style="margin-top:56px;font-size:92px">Quer saber mais sobre ${esc(item.title.split(' — ')[0])}?</h1>
  <p style="margin-top:30px;font-size:36px;color:#eae5da">Fale com um consultor</p>
  <p style="margin-top:46px;font-family:Serif,serif;font-size:64px;font-weight:500">${esc(CONTACT.phone)}</p>
  <p style="margin-top:12px;font-size:28px;color:${SAND}">WhatsApp</p>
  <p style="margin-top:60px;font-size:30px">${esc(CONTACT.consultant)} · CRECI ${esc(CONTACT.creci)}</p>
  <p style="margin-top:10px;font-size:30px;color:${SAND}">${esc(CONTACT.site.replace('https://', ''))}</p>
</div>
<p class="legal" style="text-align:center">${esc(DISCLAIMER)}</p>`)
}

async function main(): Promise<void> {
    const catalogPath = path.join(publicDir, 'data/empreendimentos.json')
    if (!existsSync(catalogPath)) throw new Error('Catálogo não encontrado: rode `npm run export:bambui` antes.')

    const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8')) as Catalog
    const only = value('only', '').split(',').map(slug => slug.trim()).filter(Boolean)
    const outDir = path.resolve(root, value('out', 'posts'))
    const items = catalog.items.filter(item => !only.length || only.includes(item.slug))

    if (only.length && items.length !== only.length) {
        const unknown = only.filter(slug => !catalog.items.some(item => item.slug === slug))
        throw new Error(`Imóvel(is) não encontrado(s) no catálogo: ${unknown.join(', ')}`)
    }

    const executablePath = BROWSERS.find(candidate => candidate && existsSync(candidate))
    if (!executablePath) throw new Error('Edge/Chrome não encontrado. Informe o caminho em BROWSER_PATH.')

    const work = path.join(os.tmpdir(), 'habitse-posts')
    mkdirSync(work, { recursive: true })
    const browser = await chromium.launch({ executablePath, headless: true })

    try {
        const tab = await browser.newPage({ viewport: { width: W, height: H } })
        const render = async (html: string, file: string) => {
            const tmp = path.join(work, 'slide.html')
            writeFileSync(tmp, html)
            await tab.goto(fileUrl(tmp))
            await tab.evaluate(() => document.fonts.ready)
            await tab.screenshot({ path: file, type: 'jpeg', quality: 90 })
        }

        for (const item of items) {
            const photos = pickSlidePhotos(item).map(photo => path.join(publicDir, photo)).filter(file => existsSync(file))
            if (!photos.length) {
                console.warn(`⚠️  ${item.slug}: sem foto local, ignorado`)
                continue
            }

            const dir = path.join(outDir, item.slug)
            rmSync(dir, { recursive: true, force: true })
            mkdirSync(dir, { recursive: true })

            await render(coverSlide(item, photos[0]), path.join(dir, '01.jpg'))
            for (let index = 1; index < photos.length; index++) await render(photoSlide(item, photos[index]), path.join(dir, `${String(index + 1).padStart(2, '0')}.jpg`))
            await render(closingSlide(item), path.join(dir, `${String(photos.length + 1).padStart(2, '0')}.jpg`))
            writeFileSync(path.join(dir, 'legenda.txt'), `${buildCaption(item)}\n`)
            console.log(`✅ ${item.slug}: ${photos.length + 1} imagens + legenda`)
        }
    } finally {
        await browser.close()
        rmSync(work, { recursive: true, force: true })
    }

    console.log(`\nPronto em ${outDir}`)
}

main().catch(error => {
    console.error(`❌ ${error instanceof Error ? error.message : error}`)
    process.exit(1)
})

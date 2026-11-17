// Gera as ilustrações de exemplo (public/placeholders/*.svg) usadas pelos anúncios de demonstração.
// São desenhos leves (poucos KB) para o site ficar rápido mesmo antes das fotos reais. Rodar: npm run placeholders
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'placeholders')
mkdirSync(out, { recursive: true })

const W = 800
const H = 600

const SKIES = [
    ['#cfe9f5', '#f4f9fb'], ['#fbe3c8', '#fdf3e6'], ['#d9e6fb', '#f2f6ff'], ['#d3efe3', '#f1faf6'], ['#efd9f3', '#faf1fc']
]

const windows = (x, y, cols, rows, gap, w, h, fill) => {
    let shapes = ''
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) shapes += `<rect x="${x + c * gap}" y="${y + r * gap}" width="${w}" height="${h}" rx="2" fill="${fill}"/>`
    return shapes
}

const ground = color => `<rect y="500" width="${W}" height="100" fill="${color}"/>`

/** Usados: casa e prédio prontos, com árvore */
function used(i) {
    const [a, b] = SKIES[i]
    const wall = ['#f2e3cf', '#e7d9c4', '#dfe9e6', '#efe0d6', '#e4e0f0'][i]
    const roof = ['#b5523b', '#7a5a46', '#3f6e66', '#a0453b', '#5b5a86'][i]
    return `<rect width="${W}" height="${H}" fill="url(#g)"/>
<circle cx="${620 + i * 20}" cy="110" r="48" fill="#fff" opacity=".7"/>
<rect x="470" y="180" width="170" height="320" fill="#cdd8d5"/>${windows(488, 200, 4, 8, 38, 24, 26, '#f7fbfa')}
<rect x="120" y="330" width="300" height="170" fill="${wall}"/><polygon points="100,335 270,235 440,335" fill="${roof}"/>
<rect x="245" y="400" width="52" height="100" rx="4" fill="#7b5d46"/>${windows(150, 365, 2, 1, 70, 54, 50, '#cfe6f2')}<rect x="330" y="365" width="54" height="50" rx="2" fill="#cfe6f2"/>
<circle cx="700" cy="440" r="48" fill="#4f9a6a"/><rect x="694" y="470" width="12" height="40" fill="#6b4f3a"/>
${ground('#b9d8b0')}`
}

/** Na planta: prédio desenhado em linhas sobre fundo de projeto */
function offPlan(i) {
    const line = ['#4f46e5', '#2563eb', '#7c3aed', '#0891b2', '#4338ca'][i]
    let grid = ''
    for (let x = 0; x <= W; x += 40) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`
    for (let y = 0; y <= H; y += 40) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`
    const floors = 5 + (i % 3)
    let tower = ''
    for (let f = 0; f < floors; f++) tower += `<rect x="${300 + (i % 2) * 20}" y="${160 + f * 48}" width="${200 + (i % 2) * 30}" height="48" fill="none" stroke="${line}" stroke-width="3"/>`
    return `<rect width="${W}" height="${H}" fill="#eef1ff"/>
<g stroke="${line}" stroke-opacity=".12" stroke-width="1">${grid}</g>
<g>${tower}<line x1="${300 + (i % 2) * 20}" y1="${160 + floors * 48}" x2="${530 + (i % 2) * 30}" y2="${160 + floors * 48}" stroke="${line}" stroke-width="5"/></g>
<g stroke="${line}" stroke-width="2" fill="none" stroke-dasharray="8 6"><path d="M120 500 H680"/><path d="M160 110 L240 110 M160 100 V120 M240 100 V120"/></g>
<text x="400" y="560" text-anchor="middle" font-family="system-ui,sans-serif" font-size="26" font-weight="700" fill="${line}" opacity=".7">LANÇAMENTO</text>`
}

/** Em construção: prédio em obra com guindaste */
function underConstruction(i) {
    const [a] = SKIES[(i + 1) % 5]
    const floors = 3 + i
    let building = ''
    for (let f = 0; f < floors; f++) {
        const y = 500 - (f + 1) * 52
        building += `<rect x="250" y="${y}" width="230" height="52" fill="#d9d2c7" stroke="#b9b0a1" stroke-width="2"/>${windows(268, y + 10, 4, 1, 52, 34, 32, '#8fb3c4')}`
    }
    const top = 500 - floors * 52
    return `<rect width="${W}" height="${H}" fill="url(#g)"/>
${building}
<g stroke="#e0921f" stroke-width="6" fill="none"><path d="M560 500 V120"/><path d="M470 120 H700"/><path d="M560 120 L470 168"/><path d="M640 120 V210"/></g>
<rect x="628" y="210" width="26" height="22" fill="#e0921f"/>
<g stroke="#c2610c" stroke-width="3"><line x1="250" y1="${top}" x2="480" y2="${top}"/><line x1="250" y1="${top}" x2="250" y2="${top - 36}"/><line x1="480" y1="${top}" x2="480" y2="${top - 36}"/></g>
<polygon points="150,500 200,455 250,500" fill="#e0921f"/><rect x="${620}" y="470" width="90" height="30" fill="#c2610c"/>
${ground('#cdbf9f')}`
}

const draw = { used, off_plan: offPlan, under_construction: underConstruction }

for (const [category, fn] of Object.entries(draw)) {
    for (let i = 0; i < 5; i++) {
        const [a, b] = SKIES[i]
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Ilustração do imóvel"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>${fn(i)}</svg>`
        writeFileSync(join(out, `${category}-${i + 1}.svg`), svg)
    }
}
console.log('Ilustrações geradas em', out)

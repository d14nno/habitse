/* eslint-disable no-console */
/**
 * Lê as tabelas de preço do mês na pasta pública do Drive da Bambuí e grava `data/bambui-tabelas.json`
 * (preço "a partir de", unidades disponíveis, entrega e registro de incorporação de cada empreendimento).
 *
 * Uso: npm run sync:drive                (grava o arquivo)
 *      npm run sync:drive -- --dry-run    (mostra o que leu, sem gravar)
 *      npm run sync:drive -- --folder=<id da pasta>   (outra pasta; o padrão é a da Bambuí)
 *      npm run sync:drive -- --start-of-month         (só roda do 1º dia útil até o dia 7 de cada mês; nos outros dias, sai sem fazer nada)
 *
 * Se faltar alguma tabela, alguma não puder ser lida ou a pasta trouxer um mês mais antigo que o já gravado,
 * NADA é gravado: o arquivo anterior continua valendo.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import pdf from 'pdf-parse'

import { DriveFolder } from '@modules/listings/services/DriveFolder'
import { monthLabel } from '@modules/listings/services/PriceTable'
import { isTableWindow, readTables, TableInfos } from '@modules/listings/services/PriceTableSync'

const DEFAULT_FOLDER = '1UOtIM779pM9B_ZqhAQ_2HS9xM4DZLzwG'

const root = path.resolve(process.cwd(), '..')
const flag = (name: string) => process.argv.includes(`--${name}`)
const value = (name: string, fallback: string) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback
const outPath = path.resolve(root, value('out', 'data/bambui-tabelas.json'))

async function main() {
    if (flag('start-of-month') && !isTableWindow(new Date())) {
        console.log('Fora do começo do mês (1º dia útil até o dia 7): nada a fazer.')
        return
    }

    const tables = await readTables(new DriveFolder(), value('folder', DEFAULT_FOLDER), async buffer => (await pdf(buffer)).text)
    const months = Array.from(new Set(Object.values(tables).map(table => table.month)))

    if (months.length > 1) throw new Error(`As tabelas são de meses diferentes (${months.join(', ')}). Confira a pasta do Drive.`)

    const previous: TableInfos | null = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : null
    const previousMonth = previous ? Object.values(previous)[0]?.month : undefined

    if (previousMonth && months[0] < previousMonth) throw new Error(`A pasta traz tabelas de ${monthLabel(months[0])}, mais antigas que as já publicadas (${monthLabel(previousMonth)}).`)

    for (const [slug, table] of Object.entries(tables)) {
        console.log(`✅ ${slug}: a partir de R$ ${table.priceFrom.toLocaleString('pt-BR')} · ${table.availableCount} disponíveis · tabela ${table.month}${table.keysDate ? ` · chaves ${table.keysDate}` : ''}${table.registry ? '' : ' — sem registro de incorporação na tabela'}`)
    }

    const json = `${JSON.stringify(Object.fromEntries(Object.entries(tables).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`
    const changed = !existsSync(outPath) || readFileSync(outPath, 'utf8') !== json

    if (flag('dry-run')) return void console.log(`\nSimulação: ${changed ? 'haveria mudança' : 'sem mudança'}.`)

    if (changed) writeFileSync(outPath, json)
    console.log(`\n${path.relative(root, outPath)}: ${changed ? 'atualizado' : 'sem mudança'}.`)
}

main().catch(error => {
    console.error('❌ Nada foi gravado:', error instanceof Error ? error.message : error)
    process.exit(1)
})

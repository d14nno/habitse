/* eslint-disable no-console */
/**
 * Importa os empreendimentos do site da Bambuí (bambui.com.br) para a vitrine do Habitse.
 *
 * Uso: npm run import:bambui                      (importa todos; os já prontos entram como rascunho)
 *      npm run import:bambui -- --dry-run          (só mostra o que faria, sem gravar)
 *      npm run import:bambui -- --only=praca-232   (um ou mais, separados por vírgula)
 *      npm run import:bambui -- --publish-ready    (publica também os prontos para morar)
 *
 * Só lê as páginas públicas de empreendimento, uma por segundo. Pode rodar de novo: atualiza textos, fotos e
 * andamento da obra e preserva preço, destaque e situação de publicação ajustados à mão.
 */
import 'dotenv/config'
import 'reflect-metadata'
import { container } from 'tsyringe'

import '@shared/containers'
import { connection } from '@shared/infra/knex'
import { getRedisClient } from '@shared/infra/redis'
import { ListingRepository } from '@modules/listings/repositories/ListingRepository'
import { BambuiImportService } from '@modules/listings/services/BambuiImportService'

const flag = (name: string) => process.argv.includes(`--${name}`)
const value = (name: string) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.split('=')[1]

async function fetchPage(url: string): Promise<string> {
    const response = await fetch(url, { headers: { 'User-Agent': 'HabitseImport/1.0 (importação dos empreendimentos da própria Bambuí)' } })
    if (!response.ok) throw new Error(`${url} respondeu ${response.status}`)

    return response.text()
}

async function main() {
    try {
        const service = new BambuiImportService(container.resolve<ListingRepository>('ListingRepository'), fetchPage)
        const only = value('only')?.split(',').map(slug => slug.trim()).filter(Boolean)
        const outcomes = await service.run({ publishReady: flag('publish-ready'), dryRun: flag('dry-run'), ...(only?.length ? { only } : {}) })

        for (const outcome of outcomes) {
            if (outcome.action === 'skipped') console.log(`⚠️  ${outcome.slug}: ignorado — ${outcome.reason}`)
            else console.log(`${flag('dry-run') ? '👀' : outcome.action === 'created' ? '✅' : '🔄'} ${outcome.name} [${outcome.status}] — falta: ${outcome.missing.join(', ')}`)
        }

        console.log(`\n${outcomes.length} empreendimento(s) lido(s)${flag('dry-run') ? ' (simulação: nada foi gravado)' : ''}.`)
    } catch (error) {
        console.error('❌', error instanceof Error ? error.message : error)
        process.exitCode = 1
    } finally {
        await connection.destroy()
        getRedisClient().disconnect()
        process.exit()
    }
}

main()

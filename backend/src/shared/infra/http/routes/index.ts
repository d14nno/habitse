import { Application, Router } from 'express'
import path from 'path'
import fs from 'fs'
import { performFullHealthCheck } from '@shared/utils/HealthCheckDatabase'
import { connection } from '@shared/infra/knex'
import { getRedisClient } from '@shared/infra/redis'

import { AccountsRoutes } from './accounts.routes'
import { SessionRoutes } from './sessions.routes'
import { AdminRoutes } from './admin.routes'
import { ListingRoutes } from './listings.routes'
import { ListingController } from '@modules/listings/useCases/ListingController'
import { DocsRoutes } from './docs.routes'

// Lido direto do package.json: `npm_package_version` só existe quando o processo
// é iniciado via `npm run ...` (em produção roda `node dist/server.js`).
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../../package.json'), 'utf-8'))

const Routes = (application: Application): void => {
    const RouterApplication = Router()

    RouterApplication.get('/health', async (_request, response) => {
        try {
            const health = await performFullHealthCheck(connection, getRedisClient())

            const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500

            response.status(statusCode).json({ ...health, version: packageJson.version })
        } catch (error: any) {
            response.status(500).json({
                status: 'error',
                timestamp: new Date().toISOString(),
                message: '❌ Erro ao executar health check',
                error: error?.message,
                version: packageJson.version
            })
        }
    })

    RouterApplication.use('/', AccountsRoutes)
    RouterApplication.use('/sessions', SessionRoutes)
    RouterApplication.use('/admin', AdminRoutes)
    RouterApplication.use('/listings', ListingRoutes)
    RouterApplication.get('/sitemap.xml', ListingController.sitemap)
    // Swagger UI (/docs) e spec OpenAPI (/docs/openapi.json); desativado em produção sem ENABLE_API_DOCS=true
    RouterApplication.use('/', DocsRoutes)

    application.use('/', RouterApplication)
}

export { Routes }

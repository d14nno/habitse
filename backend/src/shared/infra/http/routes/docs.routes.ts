import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import { parse } from 'yaml'

import { config } from '@shared/config'
import { logger } from '@shared/infra/logger'

const SPEC_RELATIVE_PATH = path.join('docs', 'openapi.yaml')

/**
 * Sobe a partir deste arquivo até encontrar docs/openapi.yaml na raiz do projeto.
 * Funciona tanto em src/ (tsnd) quanto em dist/ (node dist/server.js), já que o build copia só o src.
 */
function findSpecPath(startDir: string): string | null {
    let dir = startDir

    for (;;) {
        const candidate = path.join(dir, SPEC_RELATIVE_PATH)

        if (fs.existsSync(candidate)) return candidate

        const parent = path.dirname(dir)

        if (parent === dir) return null

        dir = parent
    }
}

/** Fora de produção a documentação fica sempre ativa; em produção só com ENABLE_API_DOCS=true */
const docsEnabled = config.get('environment') !== 'production' || config.get('application.enableDocs')

/** Swagger UI em /docs e a especificação OpenAPI (JSON) em /docs/openapi.json */
const DocsRoutes = Router()

if (docsEnabled) {
    const specPath = findSpecPath(__dirname)

    if (!specPath) {
        logger.warn('docs/openapi.yaml not found: API docs disabled')
    } else {
        try {
            // Lido e convertido uma única vez na inicialização
            const spec = parse(fs.readFileSync(specPath, 'utf-8'))

            DocsRoutes.get('/docs/openapi.json', (_request, response) => {
                response.json(spec)
            })

            DocsRoutes.use(
                '/docs',
                swaggerUi.serve,
                swaggerUi.setup(spec, {
                    customSiteTitle: config.get('application.name'),
                    swaggerOptions: { persistAuthorization: true }
                })
            )
        } catch (error) {
            logger.error({ err: error, specPath }, 'Failed to load docs/openapi.yaml: API docs disabled')
        }
    }
}

export { DocsRoutes }

/* eslint-disable @typescript-eslint/no-empty-function */
import corsExpress from 'cors'
import express, { json } from 'express'
import useragent from 'express-useragent'
import helmetExpress from 'helmet'

import 'express-async-errors'
import 'reflect-metadata'

import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'

import { config } from '@shared/config'
import sentryConfig from '@shared/config/sentry'
import '@shared/containers'
import { Routes } from '@shared/infra/http/routes'
import { validateErrorsMiddleware } from '@shared/infra/validate'
import { appErrorMiddleware } from '@shared/utils/AppError'
import { notFoundError } from '@shared/utils/NotFoundError'
import { logger } from '@shared/infra/logger'
import { LOCAL_UPLOADS_DIR } from '@services/storage/implementations/LocalStorageService'
import { randomUUID } from 'crypto'
import pinoHttp from 'pino-http'


/** Erro do log da requisição: só a causa real (o "failed with status code" do pino-http é descartado) */
function compactError(error: any) {
    if (!error || /^failed with status code/.test(error.message)) return undefined
    return {
        type: error.constructor?.name,
        message: error.message,
        ...(error.code ? { code: error.code } : {}),
        stack: String(error.stack ?? '').split('\n').slice(1, 4).map(line => line.trim()).join(' | ')
    }
}

class Application {
    public readonly express: express.Application

    constructor() {
        this.express = express()
        this.setup()
    }

    async setup() {
        this.startConfig()
        this.database()
        this.middlewares()

        this.startValidateError()
        this.loadRoutes()
        this.onError()
    }

    private startConfig(): void { }

    private database(): void { }

    private middlewares(): void {
        // Confia apenas no primeiro proxy (load balancer); com `true` qualquer cliente forjaria o IP e burlaria o rate limit
        this.express.set('trust proxy', 1)

        this.express.use(
            json({
                limit: '50mb',
                verify: (req: any, res, buf) => {
                    req.rawBody = buf
                }
            })
        )
        this.express.use(useragent.express())

        // Log estruturado de cada requisição com id (header x-request-id é devolvido na resposta)
        this.express.use(pinoHttp({
            logger,
            genReqId: (req, res) => {
                const id = (req.headers['x-request-id'] as string) || randomUUID()
                res.setHeader('x-request-id', id)
                return id
            },
            customLogLevel: (_req, res, error) => (error || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
            autoLogging: { ignore: req => req.url === '/health' },
            // Uma linha por requisição: "GET /rota 200 12ms"; a causa só aparece em erro inesperado (5xx)
            customSuccessMessage: (req, res, time) => `${req.method} ${String((req as any).originalUrl ?? req.url)} ${res.statusCode} ${Math.round(time)}ms`,
            customErrorMessage: (req, res) => `${req.method} ${String((req as any).originalUrl ?? req.url)} ${res.statusCode}`,
            serializers: {
                req: req => ({ id: req.id }),
                res: () => undefined,
                err: compactError
            }
        }))

        // Middleware para extrair e armazenar o IP do cliente
        this.express.use((req, res, next) => {
            const forwarded = req.headers['x-forwarded-for']
            const ip =
                typeof forwarded === 'string'
                    ? forwarded.split(',')[0].trim()
                    : req.socket.remoteAddress

            const ipFinal = ip?.replace('::ffff:', '')
                ; (req as any).userIp = ipFinal

            next()
        })

        this.express.use(
            corsExpress({
                origin: config.get('cors.origins') ? config.get('cors.origins').split(',').map(origin => origin.trim()).filter(Boolean) : true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
                credentials: true,
                allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
                exposedHeaders: ['Content-Type', 'Content-Length'],
                preflightContinue: false,
                optionsSuccessStatus: 204
            })
        )

        // Arquivos do storage local (somente sem DigitalOcean configurado)
        this.express.use('/uploads', express.static(LOCAL_UPLOADS_DIR, { maxAge: '7d' }))

        if (config.get('environment') === 'production') {
            this.express.use(helmetExpress({ contentSecurityPolicy: false }))
            this.express.disable('x-powered-by')
        }
    }

    private startValidateError(): void {
        if (config.get('environment') === 'production') {
            Sentry.init({
                ...sentryConfig,
                integrations: [
                    new Sentry.Integrations.Http({ tracing: true }),
                    new Tracing.Integrations.Express({ app: this.express })
                ]
            })

            this.express.use(Sentry.Handlers.tracingHandler())
            this.express.use(Sentry.Handlers.requestHandler())
        }
    }

    private loadRoutes(): void {
        Routes(this.express)
    }

    private onError() {
        this.express.use(validateErrorsMiddleware())
        this.express.use('/', notFoundError({ defaultMessage: 'Rota não encontrada' }))

        this.express.use(Sentry.Handlers.errorHandler())
        this.express.use(
            appErrorMiddleware({
                defaultMessage: 'Erro Interno',
                defaultStatusError: '500 Internal Server Error',
                defaultCode: 'internalError'
            })
        )
    }
}
export default new Application()

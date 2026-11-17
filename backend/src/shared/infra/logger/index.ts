import pino from 'pino'
import { config } from '@shared/config'

const isDevelopment = config.get('environment') === 'development'

/**
 * Logger estruturado (JSON em produção, legível em desenvolvimento).
 * Use `logger.info({ tripId }, 'mensagem')` — contexto como objeto, mensagem curta.
 */
export const logger = pino({
    level: config.get('environment') === 'test' ? 'silent' : config.get('application.logLevel'),
    redact: {
        paths: ['req.headers.authorization', 'password', '*.password', 'token', 'refreshToken', '*.token'],
        censor: '[redacted]'
    },
    ...(isDevelopment && {
        transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname,req,res,responseTime' } }
    })
})

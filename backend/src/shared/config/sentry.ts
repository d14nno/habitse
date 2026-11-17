import * as Sentry from '@sentry/node'
import { config } from '@shared/config'

export default {
    dsn: config.get('sentry.dsn'),
    tracesSampleRate: 1.0,
    release: config.get('application.version'),
    initialScope: {
        tags: {
            version: config.get('application.version'),
            environment: config.get('environment')
        }
    },
    integrations: [new Sentry.Integrations.Http({ tracing: true })],
    ...(config.get('environment') === 'development' && {
        debug: true,
        enabled: true
    })
} as Sentry.NodeOptions

import * as Sentry from '@sentry/node'
import { config } from '@shared/config'
import sentryConfig from '@shared/config/sentry'

Sentry.init(sentryConfig)

Sentry.setTag('version', config.get('application.version'))
Sentry.setTag('environment', config.get('environment'))

export default Sentry

import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { headerAuth } from '@shared/infra/http/middleware/Auth'
import { CreateSessionController } from '@modules/accounts/useCases/createSession/CreateSessionController'
import { CreateSessionTwoFactorController } from '@modules/accounts/useCases/createSessionTwoFactor/CreateSessionTwoFactorController'
import { RefreshTokenController } from '@modules/accounts/useCases/refreshToken/RefreshTokenController'
import { DeleteSessionController } from '@modules/accounts/useCases/deleteSession/DeleteSessionController'

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    message: { errors: [{ message: 'Muitas tentativas de login, tente novamente mais tarde', uniqueCode: 'RATE_LIMIT' }] }
})

const SessionRoutes = Router()

SessionRoutes.post('/', loginLimiter, CreateSessionController.validate, CreateSessionController.handle)
SessionRoutes.post('/2fa', loginLimiter, CreateSessionTwoFactorController.validate, CreateSessionTwoFactorController.handle)
SessionRoutes.post('/refresh-token', RefreshTokenController.validate, RefreshTokenController.handle)
SessionRoutes.delete('/', headerAuth(), DeleteSessionController.handle)

export { SessionRoutes }

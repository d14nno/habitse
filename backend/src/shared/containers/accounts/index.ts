import { container } from 'tsyringe'
import { KnexPasswordResetTokenRepository } from '@modules/accounts/infra/knex/repositories/KnexPasswordResetTokenRepository'
import { KnexSessionRepository } from '@modules/accounts/infra/knex/repositories/KnexSessionRepository'
import { KnexVerificationCodeRepository } from '@modules/accounts/infra/knex/repositories/KnexVerificationCodeRepository'
import { PasswordResetTokenRepository } from '@modules/accounts/repositories/PasswordResetTokenRepository'
import { SessionRepository } from '@modules/accounts/repositories/SessionRepository'
import { VerificationCodeRepository } from '@modules/accounts/repositories/VerificationCodeRepository'

container.registerSingleton<SessionRepository>('SessionRepository', KnexSessionRepository)
container.registerSingleton<PasswordResetTokenRepository>('PasswordResetTokenRepository', KnexPasswordResetTokenRepository)
container.registerSingleton<VerificationCodeRepository>('VerificationCodeRepository', KnexVerificationCodeRepository)

import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { LoginService } from '@modules/accounts/services/LoginService'
import { TwoFactorService } from '@modules/accounts/services/TwoFactorService'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

/** Segunda etapa do login: valida o código do autenticador e abre a sessão. */
@injectable()
export class CreateSessionTwoFactorUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject(LoginService)
        private loginService: LoginService
    ) { }

    async execute(userAgent: unknown, ip: string, { twoFactorToken, code }: { twoFactorToken: string, code: string }) {
        const userId = await TwoFactorService.consumeAttempt(twoFactorToken)

        if (!userId) {
            throw new AppError([{ message: 'Login expirado, entre novamente', uniqueCode: '2FA:CHALLENGE_EXPIRED' }], 401)
        }

        const user = await this.userRepository.findWithPassword({ id: userId })

        if (!user || user.status === 'inactive' || !TwoFactorService.verify(code, user.twoFactorSecret)) {
            throw new AppError([{ message: 'Código inválido', uniqueCode: '2FA:INVALID_CODE' }], 401)
        }

        await TwoFactorService.finishChallenge(twoFactorToken)

        return this.loginService.finishLogin(user.id, userAgent, ip)
    }
}

import bcrypt from 'bcrypt'
import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { LoginService } from '@modules/accounts/services/LoginService'
import { TwoFactorService } from '@modules/accounts/services/TwoFactorService'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

@injectable()
export class CreateSessionUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject(LoginService)
        private loginService: LoginService
    ) { }

    async execute(userAgent: unknown, ip: string, { email, password }: { email: string, password: string }) {
        const user = await this.userRepository.findWithPassword({ email })

        const passwordIsCorrect = user?.password ? await bcrypt.compare(password, user.password) : false

        if (!passwordIsCorrect) {
            throw new AppError(
                [{ message: 'E-mail ou senha inválidos', uniqueCode: 'CREATE_SESSION:BAD_DATA' }],
                '401 Unauthorized'
            )
        }

        if (user.status === 'inactive') {
            throw new AppError(
                [{ message: 'Usuário bloqueado', uniqueCode: 'CREATE_SESSION:USER_NOT_ACTIVE' }],
                '401 Unauthorized'
            )
        }

        // Com 2FA ativo, a sessão só é criada em POST /sessions/2fa
        if (user.twoFactorEnabled) {
            return { requires2FA: true, twoFactorToken: await TwoFactorService.createLoginChallenge(user.id) }
        }

        return this.loginService.finishLogin(user.id, userAgent, ip)
    }
}

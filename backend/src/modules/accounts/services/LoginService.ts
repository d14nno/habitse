import { inject, injectable } from 'tsyringe'

import { UserMapper } from '@modules/users/index/mappers/UserMapper'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'
import { SessionTokenService } from './SessionTokenService'

/** Etapa final do login (com ou sem 2FA): abre a sessão e devolve o AuthResponse. */
@injectable()
export class LoginService {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject(SessionTokenService)
        private sessionTokenService: SessionTokenService
    ) { }

    async finishLogin(userId: number, userAgent: unknown, ip: string) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['profile'] })

        const tokens = await this.sessionTokenService.createSession(user, userAgent, ip)

        return { user: UserMapper.toHTTP(user), ...tokens }
    }
}

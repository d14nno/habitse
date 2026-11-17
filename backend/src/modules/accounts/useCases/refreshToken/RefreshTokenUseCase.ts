import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { decodeToken, RefreshTokenPayload } from '@shared/utils/generateToken'
import { SessionRepository } from '@modules/accounts/repositories/SessionRepository'
import { SessionTokenService } from '@modules/accounts/services/SessionTokenService'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

@injectable()
export class RefreshTokenUseCase {
    constructor(
        @inject('SessionRepository')
        private sessionRepository: SessionRepository,
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject(SessionTokenService)
        private sessionTokenService: SessionTokenService
    ) { }

    async execute(refreshToken: string) {
        const decoded = decodeToken<RefreshTokenPayload>(refreshToken, 'refresh')

        if (!decoded?.sessionId) {
            throw new AppError(
                [{ message: 'Refresh token inválido', uniqueCode: 'AUTH:INVALID_REFRESH_TOKEN' }],
                401
            )
        }

        const session = await this.sessionRepository.findOne({ where: { id: decoded.sessionId } })

        if (!session || session.isExpired()) {
            throw new AppError(
                [{ message: 'Sessão expirada', uniqueCode: 'AUTH:EXPIRED_SESSION' }],
                401
            )
        }

        const user = await this.userRepository.findOne({ where: { id: session.userId } })

        if (!user || user.status === 'inactive') {
            throw new AppError(
                [{ message: 'Usuário bloqueado', uniqueCode: 'AUTH:USER_NOT_ACTIVE' }],
                401
            )
        }

        const { token, refreshToken: newRefreshToken, tokenExpiresAt } = await this.sessionTokenService.renewSession(user, session.id)

        return { token, refreshToken: newRefreshToken, tokenExpiresAt }
    }
}

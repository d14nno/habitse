import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { SessionTokenService } from '@modules/accounts/services/SessionTokenService'
import { AdminActor, AuditService } from '@modules/audit/services/AuditService'
import { UserStatus } from '@modules/users/index/entities/User'
import { UserMapper } from '@modules/users/index/mappers/UserMapper'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

/** Bloqueio (inactive) e desbloqueio (active) de usuários pelo administrador. */
@injectable()
export class UpdateUserStatusUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject(SessionTokenService)
        private sessionTokenService: SessionTokenService,
        @inject(AuditService)
        private auditService: AuditService
    ) { }

    async execute(userId: number, status: Extract<UserStatus, 'active' | 'inactive'>, actor: AdminActor) {
        if (userId === actor.id) {
            throw new AppError([{ message: 'Você não pode alterar o próprio status', uniqueCode: 'USER:CANNOT_UPDATE_SELF' }], 409)
        }

        const user = await this.userRepository.findOne({ where: { id: userId } })

        if (!user) throw new AppError([{ message: 'Usuário não encontrado', uniqueCode: 'USER:NOT_FOUND' }], 404)

        await this.userRepository.update({ status }, { where: { id: userId } })

        // Bloqueio tem efeito imediato: encerra as sessões abertas
        if (status === 'inactive') await this.sessionTokenService.revokeAllUserSessions(userId)

        await this.auditService.log(actor, {
            action: 'user.status',
            entityType: 'user',
            entityId: userId,
            data: { from: user.status, to: status }
        })

        return UserMapper.toHTTP(await this.userRepository.findOne({ where: { id: userId }, relations: ['profile'] }))
    }
}

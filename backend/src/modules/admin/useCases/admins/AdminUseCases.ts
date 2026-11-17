import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { MAX_PER_PAGE } from '@shared/types/Pagination'
import { AdminActor, AuditService } from '@modules/audit/services/AuditService'
import { CreateAdminUseCase } from '@modules/accounts/useCases/createAdmin/CreateAdminUseCase'
import { SessionTokenService } from '@modules/accounts/services/SessionTokenService'
import { AdminRole } from '@modules/users/index/enums/AdminRole'
import { UserType } from '@modules/users/index/enums/UserType'
import { UserStatus } from '@modules/users/index/entities/User'
import { UserMapper } from '@modules/users/index/mappers/UserMapper'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

@injectable()
export class ListAdminsUseCase {
    constructor(@inject('UserRepository') private userRepository: UserRepository) { }

    /** Todos os administradores (percorre as páginas: a lista nunca é truncada) */
    async execute() {
        const admins = []

        for (let page = 1; ; page += 1) {
            const result = await this.userRepository.findMany({
                where: { type: UserType.ADMIN },
                pagination: { page, perPage: MAX_PER_PAGE },
                relations: ['profile']
            })

            admins.push(...result.data.map(user => UserMapper.toHTTP(user)))

            if (page >= result.pagination.lastPage) return admins
        }
    }
}

/** Cadastro e gestão de administradores do painel (permissão admins:manage) */
@injectable()
export class ManageAdminUseCase {
    constructor(
        @inject('UserRepository') private userRepository: UserRepository,
        @inject(CreateAdminUseCase) private createAdminUseCase: CreateAdminUseCase,
        @inject(SessionTokenService) private sessionTokenService: SessionTokenService,
        @inject(AuditService) private auditService: AuditService
    ) { }

    async create(input: { email: string, name: string, password: string, adminRole: AdminRole }, actor: AdminActor) {
        const admin = await this.createAdminUseCase.execute(input)

        await this.auditService.log(actor, { action: 'admin.create', entityType: 'user', entityId: admin.id, data: { email: input.email, adminRole: input.adminRole } })

        return admin
    }

    async update(adminId: number, { adminRole, status }: { adminRole?: AdminRole, status?: Extract<UserStatus, 'active' | 'inactive'> }, actor: AdminActor) {
        if (adminId === actor.id) {
            throw new AppError([{ message: 'Você não pode alterar o próprio acesso', uniqueCode: 'ADMIN:CANNOT_UPDATE_SELF' }], 409)
        }

        const admin = await this.userRepository.findOne({ where: { id: adminId } })

        if (!admin || !admin.isAdmin) throw new AppError([{ message: 'Administrador não encontrado', uniqueCode: 'ADMIN:NOT_FOUND' }], 404)

        await this.userRepository.update({ ...(adminRole && { adminRole }), ...(status && { status }) }, { where: { id: adminId } })

        // Papel/status novos valem já: o token atual carrega o papel antigo
        await this.sessionTokenService.revokeAllUserSessions(adminId)

        await this.auditService.log(actor, {
            action: 'admin.update',
            entityType: 'user',
            entityId: adminId,
            data: { from: { adminRole: admin.adminRole, status: admin.status }, to: { adminRole, status } }
        })

        return UserMapper.toHTTP(await this.userRepository.findOne({ where: { id: adminId }, relations: ['profile'] }))
    }
}

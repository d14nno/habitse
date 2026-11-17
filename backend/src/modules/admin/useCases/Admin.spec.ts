import 'reflect-metadata'

import { expectAppError } from '@shared/tests/expectAppError'
import { AccountsTestContext, createAccountsTestContext, IP, USER_AGENT } from '@shared/tests/AccountsTestContext'
import { clearFakeRedis } from '@shared/tests/fakes/FakeRedis'
import { verifyAccessToken } from '@shared/infra/http/middleware/Auth'
import { AuditService } from '@modules/audit/services/AuditService'
import { User } from '@modules/users/index/entities/User'
import { AdminRole, Permission } from '@modules/users/index/enums/AdminRole'
import { UserType } from '@modules/users/index/enums/UserType'
import { Profile } from '@modules/users/profiles/entities/Profile'
import { ListAdminsUseCase, ManageAdminUseCase } from '@modules/admin/useCases/admins/AdminUseCases'
import { ListAuditLogsUseCase } from '@modules/admin/useCases/listAuditLogs/ListAuditLogsUseCase'

jest.mock('@shared/infra/redis', () => require('@shared/tests/fakes/FakeRedis'))

describe('Admin — administradores e auditoria', () => {
    let context: AccountsTestContext
    let manageAdmin: ManageAdminUseCase
    let listAdmins: ListAdminsUseCase
    let listAuditLogs: ListAuditLogsUseCase
    let superAdmin: { id: number }
    let actor: { id: number, ip: string }

    beforeEach(async () => {
        clearFakeRedis()
        context = createAccountsTestContext()
        const { users, auditLogs } = context.repositories
        const auditService = new AuditService(auditLogs)

        manageAdmin = new ManageAdminUseCase(users, context.createAdmin, context.services.sessionTokenService, auditService)
        listAdmins = new ListAdminsUseCase(users)
        listAuditLogs = new ListAuditLogsUseCase(auditLogs)

        superAdmin = await context.createAdmin.execute({ email: 'root@test.dev', password: '12345678', name: 'Root', adminRole: AdminRole.SUPER_ADMIN })
        actor = { id: superAdmin.id, ip: IP }
    })

    it('cria administrador com papel e permissões, e audita', async () => {
        const support = await manageAdmin.create({ email: 'Suporte@Test.dev', name: 'Suporte', password: '12345678', adminRole: AdminRole.SUPPORT }, actor)

        expect(support).toMatchObject({ email: 'suporte@test.dev', type: 'admin', adminRole: 'support', permissions: [Permission.USERS_READ, Permission.USERS_MANAGE] })
        expect(support).not.toHaveProperty('password')
        expect(context.repositories.auditLogs.logs).toEqual([
            expect.objectContaining({ adminId: superAdmin.id, action: 'admin.create', entityId: support.id, ip: IP })
        ])

        await expectAppError(manageAdmin.create({ email: 'suporte@test.dev', name: 'Outro', password: '12345678', adminRole: AdminRole.SUPPORT }, actor), 'ACCOUNT:EMAIL_ALREADY_EXISTS', 409)
        await expectAppError(manageAdmin.create({ email: 'x@test.dev', name: 'X', password: '123', adminRole: AdminRole.SUPPORT }, actor), 'ADMIN:INVALID_DATA', 400)
    })

    it('super administrador tem todas as permissões', async () => {
        const [root] = await listAdmins.execute()

        expect(root.permissions).toEqual(Object.values(Permission))
    })

    it('lista todos os administradores (sem truncar) e não inclui usuários comuns', async () => {
        // Direto no repositório (sem bcrypt): só a listagem importa aqui
        for (let i = 0; i < 105; i += 1) {
            const admin = await context.repositories.users.create(User.create({ email: `admin${i}@test.dev`, type: UserType.ADMIN, adminRole: AdminRole.SUPPORT, password: 'hash' }))
            await context.repositories.profiles.create(Profile.create({ userId: admin.id, name: `Admin ${i}`, phoneNumber: null }))
        }
        await context.register.execute(USER_AGENT, IP, { email: 'usuario@test.dev', password: '12345678', name: 'Usuário' })

        const admins = await listAdmins.execute()

        expect(admins).toHaveLength(106)
        expect(admins.every(admin => admin.type === 'admin')).toBe(true)
    })

    it('altera papel/status, encerra as sessões do administrador e audita', async () => {
        const support = await manageAdmin.create({ email: 'suporte@test.dev', name: 'Suporte', password: '12345678', adminRole: AdminRole.SUPPORT }, actor)
        const session = await context.createSession.execute(USER_AGENT, IP, { email: 'suporte@test.dev', password: '12345678' }) as { token: string }

        const updated = await manageAdmin.update(support.id, { adminRole: AdminRole.SUPER_ADMIN }, actor)

        expect(updated).toMatchObject({ adminRole: 'super_admin', permissions: Object.values(Permission) })
        await expectAppError(verifyAccessToken(session.token), 'TOKEN:EXPIRED', 401)
        expect(context.repositories.auditLogs.logs[1]).toMatchObject({
            action: 'admin.update',
            entityId: support.id,
            data: { from: { adminRole: 'support', status: 'active' }, to: { adminRole: 'super_admin' } }
        })

        const blocked = await manageAdmin.update(support.id, { status: 'inactive' }, actor)
        expect(blocked.status).toBe('inactive')
    })

    it('não altera o próprio acesso nem usuários que não são administradores', async () => {
        const { user } = await context.register.execute(USER_AGENT, IP, { email: 'usuario@test.dev', password: '12345678', name: 'Usuário' })

        await expectAppError(manageAdmin.update(superAdmin.id, { status: 'inactive' }, actor), 'ADMIN:CANNOT_UPDATE_SELF', 409)
        await expectAppError(manageAdmin.update(user.id, { adminRole: AdminRole.SUPPORT }, actor), 'ADMIN:NOT_FOUND', 404)
        await expectAppError(manageAdmin.update(999, { adminRole: AdminRole.SUPPORT }, actor), 'ADMIN:NOT_FOUND', 404)
    })

    it('auditoria: ações em ordem da mais recente, com o administrador e paginação', async () => {
        const first = await manageAdmin.create({ email: 'a@test.dev', name: 'A', password: '12345678', adminRole: AdminRole.SUPPORT }, actor)
        await manageAdmin.update(first.id, { status: 'inactive' }, actor)

        const logs = await listAuditLogs.execute({}, { page: 1, perPage: 20 })

        expect(logs.data.map(log => log.action)).toEqual(['admin.update', 'admin.create'])
        expect(logs.data[0]).toMatchObject({ admin: { id: superAdmin.id }, entityType: 'user', entityId: String(first.id), ip: IP })
        expect(logs.pagination).toMatchObject({ page: 1, total: 2 })
    })
})

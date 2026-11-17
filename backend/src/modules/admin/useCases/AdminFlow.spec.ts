import 'reflect-metadata'

import { expectAppError } from '@shared/tests/expectAppError'
import { AccountsTestContext, createAccountsTestContext, registerUser } from '@shared/tests/AccountsTestContext'
import { clearFakeRedis } from '@shared/tests/fakes/FakeRedis'
import { UserType } from '@modules/users/index/enums/UserType'
import { AdminRole, Permission, ROLE_PERMISSIONS } from '@modules/users/index/enums/AdminRole'

jest.mock('@shared/infra/redis', () => require('@shared/tests/fakes/FakeRedis'))

const PAGE = { page: 1, perPage: 10 }

async function superAdmin(context: AccountsTestContext, email = 'admin@test.dev') {
    const admin = await context.createAdmin.execute({ email, password: '12345678', name: 'Administrador', adminRole: AdminRole.SUPER_ADMIN })
    return { id: admin.id, ip: '127.0.0.1' }
}

describe('Admin', () => {
    beforeEach(() => {
        clearFakeRedis()
    })

    describe('usuários', () => {
        it('lista e filtra por tipo, status e busca', async () => {
            const context = createAccountsTestContext()
            await superAdmin(context)
            await registerUser(context, { email: 'ana@test.dev' })
            await registerUser(context, { email: 'bruno@test.dev', phoneNumber: '11987650000' })

            const users = await context.listUsers.execute({ type: UserType.USER }, PAGE)
            expect(users.data.map(user => user.email).sort()).toEqual(['ana@test.dev', 'bruno@test.dev'])

            const search = await context.listUsers.execute({ search: 'bruno' }, PAGE)
            expect(search.data.map(user => user.email)).toEqual(['bruno@test.dev'])

            const inactive = await context.listUsers.execute({ status: 'inactive' }, PAGE)
            expect(inactive.data).toHaveLength(0)
        })

        it('bloqueia (encerrando as sessões), desbloqueia e audita', async () => {
            const context = createAccountsTestContext()
            const actor = await superAdmin(context)
            const { user, refreshToken } = await registerUser(context, { email: 'ana@test.dev' })

            const blocked = await context.updateUserStatus.execute(user.id, 'inactive', actor)
            expect(blocked.status).toBe('inactive')
            await expect(context.refreshToken.execute(refreshToken)).rejects.toMatchObject({ statusCode: 401 })

            const unblocked = await context.updateUserStatus.execute(user.id, 'active', actor)
            expect(unblocked.status).toBe('active')

            const logs = await context.listAuditLogs.execute({ action: 'user.status', entityId: String(user.id) }, PAGE)
            expect(logs.data.map(log => log.data)).toEqual(expect.arrayContaining([{ from: 'active', to: 'inactive' }, { from: 'inactive', to: 'active' }]))
        })

        it('recusa alterar o próprio status e usuário inexistente', async () => {
            const context = createAccountsTestContext()
            const actor = await superAdmin(context)

            await expectAppError(context.updateUserStatus.execute(actor.id, 'inactive', actor), 'USER:CANNOT_UPDATE_SELF', 409)
            await expectAppError(context.updateUserStatus.execute(999, 'inactive', actor), 'USER:NOT_FOUND', 404)
        })

        it('detalha a conta pelo id', async () => {
            const context = createAccountsTestContext()
            const { user } = await registerUser(context, { email: 'ana@test.dev' })

            expect(await context.getAccount.execute(user.id)).toMatchObject({ id: user.id, email: 'ana@test.dev', type: UserType.USER })
            await expectAppError(context.getAccount.execute(999), 'ACCOUNT:NOT_FOUND', 404)
        })
    })

    describe('administradores', () => {
        it('cria, lista e audita', async () => {
            const context = createAccountsTestContext()
            const actor = await superAdmin(context)

            const support = await context.manageAdmin.create({ email: 'suporte@test.dev', password: '12345678', name: 'Suporte', adminRole: AdminRole.SUPPORT }, actor)

            const admins = await context.listAdmins.execute()
            expect(admins.map(admin => admin.email).sort()).toEqual(['admin@test.dev', 'suporte@test.dev'])
            expect(admins.find(admin => admin.id === support.id)?.permissions).toEqual(ROLE_PERMISSIONS[AdminRole.SUPPORT])

            const logs = await context.listAuditLogs.execute({ action: 'admin.create' }, PAGE)
            expect(logs.data).toHaveLength(1)
        })

        it('recusa e-mail já cadastrado', async () => {
            const context = createAccountsTestContext()
            const actor = await superAdmin(context)

            await expectAppError(
                context.manageAdmin.create({ email: 'admin@test.dev', password: '12345678', name: 'Outro', adminRole: AdminRole.SUPPORT }, actor),
                'ACCOUNT:EMAIL_ALREADY_EXISTS',
                409
            )
        })

        it('troca o papel, bloqueia e impede alterar o próprio acesso', async () => {
            const context = createAccountsTestContext()
            const actor = await superAdmin(context)
            const support = await context.manageAdmin.create({ email: 'suporte@test.dev', password: '12345678', name: 'Suporte', adminRole: AdminRole.SUPPORT }, actor)

            const promoted = await context.manageAdmin.update(support.id, { adminRole: AdminRole.SUPER_ADMIN }, actor)
            expect(promoted.permissions).toContain(Permission.ADMINS_MANAGE)

            const blocked = await context.manageAdmin.update(support.id, { status: 'inactive' }, actor)
            expect(blocked.status).toBe('inactive')

            await expectAppError(context.manageAdmin.update(actor.id, { adminRole: AdminRole.SUPPORT }, actor), 'ADMIN:CANNOT_UPDATE_SELF', 409)
        })

        it('não trata usuário comum como administrador', async () => {
            const context = createAccountsTestContext()
            const actor = await superAdmin(context)
            const { user } = await registerUser(context, { email: 'ana@test.dev' })

            await expectAppError(context.manageAdmin.update(user.id, { adminRole: AdminRole.SUPPORT }, actor), 'ADMIN:NOT_FOUND', 404)
        })
    })
})

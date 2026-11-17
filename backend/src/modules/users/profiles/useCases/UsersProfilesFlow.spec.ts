import 'reflect-metadata'

import { createAccountsTestContext, registerUser } from '@shared/tests/AccountsTestContext'
import { clearFakeRedis } from '@shared/tests/fakes/FakeRedis'

jest.mock('@shared/infra/redis', () => require('@shared/tests/fakes/FakeRedis'))

describe('Perfil', () => {
    beforeEach(() => {
        clearFakeRedis()
    })

    it('atualiza nome e telefone', async () => {
        const context = createAccountsTestContext()
        const { user } = await registerUser(context, { email: 'ana@test.dev' })

        await context.updateProfile.execute(user.id, { name: 'Ana Souza', phoneNumber: '21987654321' })

        const account = await context.getAccount.execute(user.id)
        expect(account.profile).toMatchObject({ name: 'Ana Souza', phoneNumber: '21987654321' })
    })

    it('limpa o telefone com null', async () => {
        const context = createAccountsTestContext()
        const { user } = await registerUser(context, { email: 'ana@test.dev', phoneNumber: '11987654321' })

        await context.updateProfile.execute(user.id, { phoneNumber: null })

        const account = await context.getAccount.execute(user.id)
        expect(account.profile?.phoneNumber ?? null).toBeNull()
        expect(account.profile?.name).toBe('Usuário Teste')
    })
})

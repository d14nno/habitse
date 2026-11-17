import 'reflect-metadata'
import { authenticator } from 'otplib'

import { verifyAccessToken } from '@shared/infra/http/middleware/Auth'
import { expectAppError } from '@shared/tests/expectAppError'
import { AccountsTestContext, createAccountsTestContext, IP, registerUser, USER_AGENT } from '@shared/tests/AccountsTestContext'
import { clearFakeRedis } from '@shared/tests/fakes/FakeRedis'
import { VerificationChannel } from '@modules/accounts/enums/VerificationChannel'
import { AdminRole } from '@modules/users/index/enums/AdminRole'

jest.mock('@shared/infra/redis', () => require('@shared/tests/fakes/FakeRedis'))

const login = (context: AccountsTestContext, email = 'usuario@test.dev', password = '12345678') =>
    context.createSession.execute(USER_AGENT, IP, { email, password }) as Promise<any>

/** Primeiro número de 6 dígitos da mensagem (ignora cores do HTML, ex.: #000000) */
const lastCode = (html: string) => html.match(/(?<!#)\b\d{6}\b/)?.[0]

describe('Contas', () => {
    let context: AccountsTestContext

    beforeEach(() => {
        clearFakeRedis()
        context = createAccountsTestContext()
    })

    describe('cadastro e login', () => {
        it('cadastra usuário comum já com sessão aberta', async () => {
            const result = await registerUser(context)

            expect(result.user).toMatchObject({ type: 'user', status: 'active', twoFactorEnabled: false, profile: { name: 'Usuário Teste' } })
            expect(result.user).not.toHaveProperty('password')
            expect(await verifyAccessToken(result.token)).toMatchObject({ id: result.user.id, type: 'user' })
        })

        it('recusa e-mail duplicado', async () => {
            await registerUser(context)

            await expectAppError(registerUser(context), 'ACCOUNT:EMAIL_ALREADY_EXISTS', 409)
        })

        it('login com senha errada ou usuário bloqueado falha', async () => {
            const { user } = await registerUser(context)

            await expectAppError(login(context, 'usuario@test.dev', 'errada123'), 'CREATE_SESSION:BAD_DATA', 401)
            await expectAppError(login(context, 'naoexiste@test.dev'), 'CREATE_SESSION:BAD_DATA', 401)

            await context.repositories.users.update({ status: 'inactive' }, { where: { id: user.id } })

            await expectAppError(login(context), 'CREATE_SESSION:USER_NOT_ACTIVE', 401)
        })

        it('refresh renova os tokens e o logout invalida a sessão', async () => {
            await registerUser(context)
            const session = await login(context)

            const renewed = await context.refreshToken.execute(session.refreshToken)
            expect(renewed.token).toEqual(expect.any(String))

            // Access token não serve como refresh token
            await expectAppError(context.refreshToken.execute(session.token), 'AUTH:INVALID_REFRESH_TOKEN', 401)

            const authenticated = await verifyAccessToken(renewed.token)
            await context.deleteSession.execute(authenticated)

            await expectAppError(verifyAccessToken(renewed.token), 'TOKEN:EXPIRED', 401)
            await expectAppError(context.refreshToken.execute(renewed.refreshToken), 'AUTH:EXPIRED_SESSION', 401)
        })
    })

    describe('2FA (TOTP)', () => {
        it('ativa, exige o código no login e desativa', async () => {
            const { user } = await registerUser(context)

            const { secret, qrCode } = await context.setupTwoFactor.execute(user.id)
            expect(qrCode).toMatch(/^data:image\/png;base64,/)

            await expectAppError(context.enableTwoFactor.execute(user.id, '000000'), '2FA:INVALID_CODE', 400)
            await context.enableTwoFactor.execute(user.id, authenticator.generate(secret))

            await expectAppError(context.setupTwoFactor.execute(user.id), '2FA:ALREADY_ENABLED', 409)

            const challenge = await login(context)
            expect(challenge).toEqual({ requires2FA: true, twoFactorToken: expect.any(String) })

            await expectAppError(
                context.createSessionTwoFactor.execute(USER_AGENT, IP, { twoFactorToken: challenge.twoFactorToken, code: '000000' }),
                '2FA:INVALID_CODE',
                401
            )

            const session = await context.createSessionTwoFactor.execute(USER_AGENT, IP, {
                twoFactorToken: challenge.twoFactorToken,
                code: authenticator.generate(secret)
            })
            expect(session.user.twoFactorEnabled).toBe(true)

            // O desafio é de uso único
            await expectAppError(
                context.createSessionTwoFactor.execute(USER_AGENT, IP, { twoFactorToken: challenge.twoFactorToken, code: authenticator.generate(secret) }),
                '2FA:CHALLENGE_EXPIRED',
                401
            )

            await context.disableTwoFactor.execute(user.id, authenticator.generate(secret))
            expect(await login(context)).toHaveProperty('token')
        })

        it('bloqueia o desafio depois de 5 tentativas', async () => {
            const { user } = await registerUser(context)
            const { secret } = await context.setupTwoFactor.execute(user.id)
            await context.enableTwoFactor.execute(user.id, authenticator.generate(secret))

            const { twoFactorToken } = await login(context)

            for (let attempt = 0; attempt < 5; attempt++) {
                await expectAppError(context.createSessionTwoFactor.execute(USER_AGENT, IP, { twoFactorToken, code: '000000' }), '2FA:INVALID_CODE')
            }

            await expectAppError(
                context.createSessionTwoFactor.execute(USER_AGENT, IP, { twoFactorToken, code: authenticator.generate(secret) }),
                '2FA:CHALLENGE_EXPIRED'
            )
        })
    })

    describe('senha', () => {
        it('recupera a senha com o código enviado por e-mail (uso único)', async () => {
            await registerUser(context)

            // E-mail desconhecido: mesma resposta, nenhum envio
            await context.createPasswordResetToken.execute({ ip: IP, email: 'naoexiste@test.dev' })
            expect(context.services.email.sentEmails).toHaveLength(0)

            await context.createPasswordResetToken.execute({ ip: IP, email: 'usuario@test.dev' })
            const token = lastCode(context.services.email.lastEmail.html)

            await expectAppError(
                context.resetPassword.execute({ email: 'usuario@test.dev', token: token === '111111' ? '222222' : '111111', password: 'novaSenha123' }),
                'PASSWORD_RESET_TOKEN:INVALID_TOKEN'
            )

            await context.resetPassword.execute({ email: 'usuario@test.dev', token, password: 'novaSenha123' })

            expect(await login(context, 'usuario@test.dev', 'novaSenha123')).toHaveProperty('token')
            await expectAppError(
                context.resetPassword.execute({ email: 'usuario@test.dev', token, password: 'outraSenha123' }),
                'PASSWORD_RESET_TOKEN:INVALID_TOKEN'
            )
        })

        it('troca a senha exigindo a senha atual', async () => {
            const { user } = await registerUser(context)

            await expectAppError(context.updatePassword.execute(user.id, { passwordOld: 'errada123', password: 'novaSenha123' }), 'UPDATE:PASSWORD:WRONG_CURRENT_PASSWORD', 401)

            await context.updatePassword.execute(user.id, { passwordOld: '12345678', password: 'novaSenha123' })

            expect(await login(context, 'usuario@test.dev', 'novaSenha123')).toHaveProperty('token')
        })
    })

    describe('verificação de e-mail e telefone', () => {
        it('confirma o e-mail com o código e bloqueia reenvio imediato', async () => {
            const { user } = await registerUser(context)

            await context.requestVerification.execute(user.id, VerificationChannel.EMAIL)
            const code = lastCode(context.services.email.lastEmail.html)

            await expectAppError(context.requestVerification.execute(user.id, VerificationChannel.EMAIL), 'VERIFICATION:TOO_SOON', 429)
            await expectAppError(context.confirmVerification.execute(user.id, VerificationChannel.EMAIL, code === '000000' ? '111111' : '000000'), 'VERIFICATION:INVALID_CODE')

            const verified = await context.confirmVerification.execute(user.id, VerificationChannel.EMAIL, code)

            expect(verified.emailVerifiedAt).toBeInstanceOf(Date)
        })
    })

    describe('perfil', () => {
        it('troca o avatar e remove o arquivo anterior', async () => {
            const { user } = await registerUser(context)
            const file = { buffer: Buffer.from('img'), mimetype: 'image/png', originalName: 'a.png' }

            const first = await context.uploadAvatar.execute(user.id, file)
            const second = await context.uploadAvatar.execute(user.id, file)

            expect(second.avatarUrl).not.toBe(first.avatarUrl)
            expect(context.services.storage.files.size).toBe(1)
        })
    })

    describe('admin', () => {
        it('bloquear um usuário encerra as sessões e registra auditoria', async () => {
            const admin = await context.createAdmin.execute({ email: 'admin@test.dev', password: '12345678', name: 'Admin', adminRole: AdminRole.SUPER_ADMIN })
            const { user, token } = await registerUser(context)

            await expectAppError(context.updateUserStatus.execute(admin.id, 'inactive', { id: admin.id }), 'USER:CANNOT_UPDATE_SELF', 409)

            const blocked = await context.updateUserStatus.execute(user.id, 'inactive', { id: admin.id, ip: IP })

            expect(blocked.status).toBe('inactive')
            await expectAppError(verifyAccessToken(token), 'TOKEN:EXPIRED', 401)
            expect(context.repositories.auditLogs.logs).toEqual([
                expect.objectContaining({ adminId: admin.id, action: 'user.status', entityId: user.id, data: { from: 'active', to: 'inactive' } })
            ])
        })
    })
})

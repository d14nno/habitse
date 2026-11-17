import 'reflect-metadata'
import { authenticator } from 'otplib'
import request from 'supertest'
import { container } from 'tsyringe'

import Application from '@shared/infra/http/app'
import { connection } from '@shared/infra/knex'
import { getRedisClient } from '@shared/infra/redis'
import { InMemoryEmailService } from '@services/email/implementations/InMemoryEmailService'
import { InMemoryStorageService } from '@services/storage/implementations/InMemoryStorageService'

/**
 * Fluxo completo pela API real (rotas, middlewares, Postgres, Redis).
 * Somente integrações externas são substituídas (e-mail e storage).
 */
const app = Application.express
const email = new InMemoryEmailService()

container.registerInstance('EmailService', email)
container.registerInstance('StorageService', new InMemoryStorageService())

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` })

/** Primeiro número de 6 dígitos da mensagem (ignora cores do HTML, ex.: #000000) */
const codeFrom = (html: string) => html.match(/(?<!#)\b\d{6}\b/)?.[0]

async function login(emailAddress: string, password = '12345678') {
    const response = await request(app).post('/sessions').send({ email: emailAddress, password })
    expect(response.status).toBe(200)
    return response.body
}

describe('Contas (integração)', () => {
    let user: { id: number, token: string, refreshToken: string }
    let admin: string

    afterAll(async () => {
        await connection.destroy()
        getRedisClient().disconnect()
    })

    it('health ok com banco e redis', async () => {
        const response = await request(app).get('/health')

        expect(response.status).toBe(200)
        expect(response.body).toMatchObject({ status: 'ok', database: { status: 'connected' }, redis: { status: 'connected' } })
    })

    it('cadastra, valida payload e recusa e-mail duplicado', async () => {
        const invalid = await request(app).post('/accounts').send({ email: 'x', password: '1', name: 'A', document: '11111111111' })
        expect(invalid.status).toBe(400)
        expect(invalid.body.errors.map((error: any) => error.details.path[0])).toEqual(expect.arrayContaining(['email', 'password', 'name', 'document', 'phoneNumber']))

        const company = await request(app).post('/accounts').send({
            email: 'empresa@test.dev', password: '12345678', name: 'Empresa Exemplo', phoneNumber: '(62) 3333-4444', document: '11.222.333/0001-81'
        })
        expect(company.status).toBe(201)
        expect(company.body.user.profile).toMatchObject({ document: '11222333000181', phoneNumber: '6233334444' })

        const badCnpj = await request(app).post('/accounts').send({
            email: 'empresa2@test.dev', password: '12345678', name: 'Outra Empresa', phoneNumber: '62933334444', document: '11.222.333/0001-82'
        })
        expect(badCnpj.status).toBe(400)

        const response = await request(app).post('/accounts').send({
            email: 'E2E@Test.dev', password: '12345678', name: 'Usuário E2E', phoneNumber: '(11) 98765-4321', document: '529.982.247-25'
        })
        expect(response.status).toBe(201)
        expect(response.body.user).toMatchObject({
            email: 'e2e@test.dev', type: 'user', permissions: [], profile: { phoneNumber: '11987654321', document: '52998224725' }
        })
        user = { id: response.body.user.id, token: response.body.token, refreshToken: response.body.refreshToken }

        const duplicated = await request(app).post('/accounts').send({ email: 'e2e@test.dev', password: '12345678', name: 'Outro', phoneNumber: '11912345678', document: '529.982.247-25' })
        expect(duplicated.status).toBe(409)
        expect(duplicated.body.errors[0].uniqueCode).toBe('ACCOUNT:EMAIL_ALREADY_EXISTS')
    })

    it('rotas protegidas exigem token válido', async () => {
        expect((await request(app).get('/accounts/me')).body.errors[0].uniqueCode).toBe('TOKEN:NO_PROVIDED')
        expect((await request(app).get('/accounts/me').set(bearer('abc'))).body.errors[0].uniqueCode).toBe('TOKEN:INVALID')

        const me = await request(app).get('/accounts/me').set(bearer(user.token))
        expect(me.status).toBe(200)
        expect(me.body).not.toHaveProperty('password')
    })

    it('atualiza perfil e avatar', async () => {
        const profile = await request(app).patch('/accounts/profile').set(bearer(user.token)).send({ name: 'Nome Novo', birthDate: '1990-05-20' })
        expect(profile.status).toBe(204)

        const avatar = await request(app).post('/accounts/avatar').set(bearer(user.token)).attach('file', Buffer.from('png'), { filename: 'a.png', contentType: 'image/png' })
        expect(avatar.status).toBe(200)

        const me = await request(app).get('/accounts/me').set(bearer(user.token))
        expect(me.body.profile).toMatchObject({ name: 'Nome Novo', birthDate: '1990-05-20', avatarUrl: avatar.body.avatarUrl })
    })

    it('verifica o e-mail com o código', async () => {
        expect((await request(app).post('/accounts/verifications').set(bearer(user.token)).send({ channel: 'email' })).status).toBe(204)

        const confirmed = await request(app).patch('/accounts/verifications').set(bearer(user.token))
            .send({ channel: 'email', code: codeFrom(email.lastEmail.html) })

        expect(confirmed.status).toBe(200)
        expect(confirmed.body.emailVerifiedAt).toEqual(expect.any(String))
    })

    it('login com 2FA em duas etapas', async () => {
        const setup = await request(app).post('/accounts/2fa').set(bearer(user.token))
        expect(setup.status).toBe(200)

        const enable = await request(app).put('/accounts/2fa').set(bearer(user.token)).send({ code: authenticator.generate(setup.body.secret) })
        expect(enable.status).toBe(204)

        const challenge = await login('e2e@test.dev')
        expect(challenge).toEqual({ requires2FA: true, twoFactorToken: expect.any(String) })

        const session = await request(app).post('/sessions/2fa').send({ twoFactorToken: challenge.twoFactorToken, code: authenticator.generate(setup.body.secret) })
        expect(session.status).toBe(200)
        expect(session.body.user.twoFactorEnabled).toBe(true)

        const disable = await request(app).delete('/accounts/2fa').set(bearer(session.body.token)).send({ code: authenticator.generate(setup.body.secret) })
        expect(disable.status).toBe(204)
    })

    it('recupera a senha pelo código do e-mail', async () => {
        expect((await request(app).post('/password-reset-tokens').send({ email: 'naoexiste@test.dev' })).status).toBe(204)
        expect((await request(app).post('/password-reset-tokens').send({ email: 'e2e@test.dev' })).status).toBe(204)

        const reset = await request(app).patch('/password-reset-tokens').send({ email: 'e2e@test.dev', token: codeFrom(email.lastEmail.html), password: 'novaSenha123' })
        expect(reset.status).toBe(204)

        await login('e2e@test.dev', 'novaSenha123')
    })

    it('refresh token renova e logout encerra a sessão', async () => {
        const session = await login('e2e@test.dev', 'novaSenha123')

        const refreshed = await request(app).post('/sessions/refresh-token').set(bearer(session.refreshToken))
        expect(refreshed.status).toBe(200)

        expect((await request(app).delete('/sessions').set(bearer(refreshed.body.token))).status).toBe(204)

        const after = await request(app).get('/accounts/me').set(bearer(refreshed.body.token))
        expect(after.status).toBe(401)
        expect(after.body.errors[0].uniqueCode).toBe('TOKEN:EXPIRED')
    })

    it('admin lista, bloqueia o usuário e consulta a auditoria', async () => {
        admin = (await login('admin@app.dev')).token

        expect((await request(app).get('/admin/users').set(bearer(user.token))).body.errors[0].uniqueCode).toBe('AUTH:USER_TYPE_FORBIDDEN')

        const list = await request(app).get('/admin/users').set(bearer(admin)).query({ search: 'e2e' })
        expect(list.status).toBe(200)
        expect(list.body.data.map((item: any) => item.id)).toEqual([user.id])

        const blocked = await request(app).patch(`/admin/users/${user.id}/status`).set(bearer(admin)).send({ status: 'inactive' })
        expect(blocked.status).toBe(200)

        // Sessões do usuário bloqueado caem na hora e o login é recusado
        expect((await request(app).get('/accounts/me').set(bearer(user.token))).status).toBe(401)
        const loginBlocked = await request(app).post('/sessions').send({ email: 'e2e@test.dev', password: 'novaSenha123' })
        expect(loginBlocked.body.errors[0].uniqueCode).toBe('CREATE_SESSION:USER_NOT_ACTIVE')

        const audit = await request(app).get('/admin/audit-logs').set(bearer(admin)).query({ action: 'user.status' })
        expect(audit.body.data[0]).toMatchObject({ action: 'user.status', entityId: String(user.id), data: { from: 'active', to: 'inactive' } })
    })

    it('permissões por papel: suporte não gerencia administradores', async () => {
        const support = (await login('suporte@app.dev')).token

        const denied = await request(app).get('/admin/admins').set(bearer(support))
        expect(denied.status).toBe(403)
        expect(denied.body.errors[0].uniqueCode).toBe('AUTH:PERMISSION_DENIED')

        const created = await request(app).post('/admin/admins').set(bearer(admin))
            .send({ email: 'novo.admin@test.dev', name: 'Novo Admin', password: '12345678', adminRole: 'support' })
        expect(created.status).toBe(201)
        expect(created.body).toMatchObject({ type: 'admin', adminRole: 'support', permissions: ['users:read', 'users:manage'] })
    })
})

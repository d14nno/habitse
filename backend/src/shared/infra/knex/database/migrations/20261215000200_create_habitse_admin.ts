import type { Knex } from 'knex'

/**
 * Administrador do painel (/admin). Só o hash bcrypt da senha fica aqui (a senha em si foi entregue ao dono do site):
 * troque-a depois de entrar. Se o e-mail já existir (por exemplo, criado pela migration anterior com ADMIN_EMAIL), nada é alterado.
 */
const EMAIL = 'admin@habitse.com.br'
const PASSWORD_HASH = '$2b$12$OFA9uGoSn3LL/49XJtZJFOJvHu9s6ApT8mf5bzJ49/O9J0Kn.qlNW'

export async function up(knex: Knex): Promise<void> {
    if (await knex('users.users').where({ email: EMAIL }).first()) return

    const [{ id }] = await knex('users.users')
        .insert({ email: EMAIL, password: PASSWORD_HASH, type: 'admin', adminRole: 'super_admin', status: 'active', emailVerifiedAt: new Date() })
        .returning('id')
    await knex('users.profiles').insert({ userId: id, name: 'Administrador', phoneNumber: null })
}

export async function down(knex: Knex): Promise<void> {
    await knex('users.users').where({ email: EMAIL, type: 'admin' }).del()
}

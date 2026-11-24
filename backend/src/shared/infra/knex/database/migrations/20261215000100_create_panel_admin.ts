import bcrypt from 'bcrypt'
import type { Knex } from 'knex'

/**
 * Administrador do painel (/admin), criado a partir do `.env` — a senha nunca fica no repositório.
 * Defina ADMIN_EMAIL, ADMIN_PASSWORD (mín. 8 caracteres) e, se quiser, ADMIN_NAME ANTES de rodar as migrations.
 * Sem as variáveis, nada é criado. Se o e-mail já existir, nada é alterado.
 */
export async function up(knex: Knex): Promise<void> {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.ADMIN_PASSWORD
    if (!email || !password) return
    if (password.length < 8) throw new Error('ADMIN_PASSWORD precisa ter pelo menos 8 caracteres.')
    if (await knex('users.users').where({ email }).first()) return

    const [{ id }] = await knex('users.users')
        .insert({ email, password: await bcrypt.hash(password, 10), type: 'admin', adminRole: 'super_admin', status: 'active', emailVerifiedAt: new Date() })
        .returning('id')
    await knex('users.profiles').insert({ userId: id, name: process.env.ADMIN_NAME?.trim() || 'Administrador', phoneNumber: null })
}

export async function down(): Promise<void> {
    // Contas não são apagadas ao desfazer a migration
}

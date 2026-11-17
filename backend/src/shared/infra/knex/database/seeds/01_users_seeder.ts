import bcrypt from 'bcrypt'
import { Knex } from 'knex'


const SEED_EMAILS = ['admin@app.dev', 'suporte@app.dev']

/**
 * Dados de desenvolvimento (senha de todos: 12345678):
 * - admin@app.dev   → painel (super_admin)
 * - suporte@app.dev → painel (support)
 */
export async function seed(knex: Knex): Promise<void> {
    // Remove apenas os dados de teste (perfis, sessões e códigos caem em cascata)
    await knex('users.users').whereIn('email', SEED_EMAILS).del()

    const password = await bcrypt.hash('12345678', 10)
    const now = new Date()

    const insertUser = async (email: string, type: string, name: string, phoneNumber: string | null, extra: Record<string, unknown> = {}) => {
        const [{ id }] = await knex('users.users')
            .insert({ email, password, type, status: 'active', emailVerifiedAt: now, ...extra })
            .returning('id')
        await knex('users.profiles').insert({ userId: id, name, phoneNumber })
        return id
    }

    await insertUser('admin@app.dev', 'admin', 'Administrador', null, { adminRole: 'super_admin' })
    await insertUser('suporte@app.dev', 'admin', 'Suporte', null, { adminRole: 'support' })
}

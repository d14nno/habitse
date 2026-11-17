import type { Knex } from 'knex'

/** Contas: usuários, perfis, sessões, recuperação de senha, códigos de verificação e auditoria do admin. */
export async function up(knex: Knex): Promise<void> {
    const ts = (table: Knex.CreateTableBuilder, column: string) => table.timestamp(column, { useTz: true })
    const timestamps = (table: Knex.CreateTableBuilder) => {
        ts(table, 'createdAt').notNullable().defaultTo(knex.fn.now())
        ts(table, 'updatedAt').notNullable().defaultTo(knex.fn.now())
    }
    const userRef = (table: Knex.CreateTableBuilder, column: string, onDelete = 'CASCADE') =>
        table.bigInteger(column).references('id').inTable('users.users').onDelete(onDelete)

    await knex.raw('CREATE SCHEMA IF NOT EXISTS users')

    await knex.schema.withSchema('users').createTable('users', table => {
        table.bigIncrements('id').primary()
        table.string('email').notNullable().unique()
        table.string('password').nullable()
        table.string('type').notNullable().defaultTo('user')
        table.string('status').notNullable().defaultTo('active')
        table.string('adminRole').nullable()
        ts(table, 'emailVerifiedAt').nullable()
        table.string('twoFactorSecret').nullable()
        table.boolean('twoFactorEnabled').notNullable().defaultTo(false)
        table.boolean('isDeleted').notNullable().defaultTo(false)
        timestamps(table)
        ts(table, 'deletedAt').nullable()

        table.check('?? in (\'user\', \'admin\')', ['type'], 'users_type_check')
        table.check('?? in (\'pending\', \'active\', \'inactive\')', ['status'], 'users_status_check')
        table.check('?? is null or ?? in (\'super_admin\', \'support\')', ['adminRole', 'adminRole'], 'users_admin_role_check')
    })

    await knex.schema.withSchema('users').createTable('profiles', table => {
        table.bigIncrements('id').primary()
        userRef(table, 'userId').notNullable().unique()
        table.string('name').notNullable()
        table.string('phoneNumber').nullable()
        table.string('document', 20).nullable()
        table.date('birthDate').nullable()
        table.string('avatarUrl').nullable()
        table.string('avatarKey').nullable()
        timestamps(table)
    })

    await knex.schema.withSchema('users').createTable('sessions', table => {
        table.bigIncrements('id').primary()
        userRef(table, 'userId').notNullable()
        table.string('provider').notNullable().defaultTo('password')
        table.text('accessToken').nullable()
        table.text('refreshToken').nullable()
        table.jsonb('userAgent').nullable()
        table.string('ip').nullable()
        ts(table, 'expiresAt').nullable()
        timestamps(table)
        table.index(['userId'])
    })

    await knex.schema.withSchema('users').createTable('password_reset_tokens', table => {
        table.bigIncrements('id').primary()
        userRef(table, 'userId').notNullable()
        table.string('ip').nullable()
        table.string('token').notNullable()
        ts(table, 'createdAt').notNullable().defaultTo(knex.fn.now())
        table.index(['userId', 'token'])
    })

    await knex.schema.withSchema('users').createTable('verification_codes', table => {
        table.bigIncrements('id').primary()
        userRef(table, 'userId').notNullable()
        table.string('channel').notNullable()
        table.string('target').notNullable()
        table.string('codeHash').notNullable()
        table.smallint('attempts').notNullable().defaultTo(0)
        ts(table, 'expiresAt').notNullable()
        ts(table, 'createdAt').notNullable().defaultTo(knex.fn.now())
        table.index(['userId', 'channel'])
    })

    await knex.raw('CREATE SCHEMA IF NOT EXISTS audit')

    await knex.schema.withSchema('audit').createTable('audit_logs', table => {
        table.bigIncrements('id').primary()
        userRef(table, 'adminId', 'SET NULL').nullable()
        table.string('action').notNullable()
        table.string('entityType').notNullable()
        table.string('entityId').nullable()
        table.jsonb('data').notNullable().defaultTo('{}')
        table.string('ip').nullable()
        ts(table, 'createdAt').notNullable().defaultTo(knex.fn.now())
        table.index(['entityType', 'entityId'])
        table.index(['adminId', 'createdAt'])
    })
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('DROP SCHEMA IF EXISTS audit CASCADE')
    await knex.raw('DROP SCHEMA IF EXISTS users CASCADE')
}

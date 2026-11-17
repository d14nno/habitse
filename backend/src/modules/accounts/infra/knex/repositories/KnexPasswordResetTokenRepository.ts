import { PasswordResetToken } from '@modules/accounts/entities/PasswordResetToken'
import { PasswordResetTokenRepository } from '@modules/accounts/repositories/PasswordResetTokenRepository'
import { connection } from '@shared/infra/knex'

export class KnexPasswordResetTokenRepository implements PasswordResetTokenRepository {
    private table = 'users.password_reset_tokens'

    async create(passwordResetToken: PasswordResetToken): Promise<PasswordResetToken> {
        const [{ id }] = await connection(this.table).insert(passwordResetToken.props).returning('id')

        passwordResetToken.id = id

        return passwordResetToken
    }

    async findOne({ where }: { where: { userId: number, token: string } }): Promise<PasswordResetToken | null> {
        const result = await connection(this.table).where(where).orderBy('createdAt', 'desc').first()

        return result ? new PasswordResetToken(result) : null
    }

    async deleteByUserId(userId: number): Promise<boolean> {
        const rows = await connection(this.table).where({ userId }).delete()

        return rows > 0
    }
}

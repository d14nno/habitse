import { PasswordResetToken } from '@modules/accounts/entities/PasswordResetToken'
import { PasswordResetTokenRepository } from '@modules/accounts/repositories/PasswordResetTokenRepository'

export class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
    public tokens: PasswordResetToken[] = []
    private idCounter = 1

    async create(passwordResetToken: PasswordResetToken): Promise<PasswordResetToken> {
        passwordResetToken.id = this.idCounter++
        this.tokens.push(passwordResetToken)
        return passwordResetToken
    }

    async findOne({ where }: { where: { userId: number, token: string } }): Promise<PasswordResetToken | null> {
        return [...this.tokens].reverse().find(item => item.userId === where.userId && item.token === where.token) ?? null
    }

    async deleteByUserId(userId: number): Promise<boolean> {
        const before = this.tokens.length
        this.tokens = this.tokens.filter(item => item.userId !== userId)
        return this.tokens.length < before
    }
}

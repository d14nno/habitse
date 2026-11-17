import { PasswordResetToken } from '../entities/PasswordResetToken'

export interface PasswordResetTokenRepository {
    create(passwordResetToken: PasswordResetToken): Promise<PasswordResetToken>

    findOne(options: { where: { userId: number, token: string } }): Promise<PasswordResetToken | null>

    deleteByUserId(userId: number): Promise<boolean>
}

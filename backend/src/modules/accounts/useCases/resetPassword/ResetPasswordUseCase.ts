import bcrypt from 'bcrypt'
import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { PasswordResetTokenRepository } from '@modules/accounts/repositories/PasswordResetTokenRepository'
import { PASSWORD_SALT_ROUNDS } from '@modules/accounts/useCases/register/RegisterAccountUseCase'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

@injectable()
export class ResetPasswordUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject('PasswordResetTokenRepository')
        private passwordResetTokenRepository: PasswordResetTokenRepository
    ) { }

    async execute({ email, token, password }: { email: string, token: string, password: string }): Promise<void> {
        const user = await this.userRepository.findOne({ where: { email } })

        const passwordResetToken = user
            ? await this.passwordResetTokenRepository.findOne({ where: { userId: user.id, token } })
            : null

        if (!passwordResetToken || passwordResetToken.isExpired()) {
            throw new AppError(
                [{ message: 'Código inválido ou expirado', uniqueCode: 'PASSWORD_RESET_TOKEN:INVALID_TOKEN' }],
                400
            )
        }

        await this.userRepository.update(
            { password: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS) },
            { where: { id: user.id } }
        )

        await this.passwordResetTokenRepository.deleteByUserId(user.id)
    }
}

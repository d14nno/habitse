import { inject, injectable } from 'tsyringe'

import { config } from '@shared/config'
import { EmailService } from '@services/email/EmailService'
import { escapeHtml } from '@shared/utils/EscapeHtml'
import { PasswordResetToken, PASSWORD_RESET_TOKEN_TTL_MINUTES } from '@modules/accounts/entities/PasswordResetToken'
import { PasswordResetTokenRepository } from '@modules/accounts/repositories/PasswordResetTokenRepository'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

@injectable()
export class CreatePasswordResetTokenUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject('PasswordResetTokenRepository')
        private passwordResetTokenRepository: PasswordResetTokenRepository,
        @inject('EmailService')
        private emailService: EmailService
    ) { }

    async execute({ ip, email }: { ip: string, email: string }): Promise<void> {
        const user = await this.userRepository.findOne({ where: { email }, relations: ['profile'] })

        // Não revela se o e-mail está cadastrado: a resposta é a mesma nos dois casos
        if (!user || user.status === 'inactive') return

        // Apenas o último código enviado é válido
        await this.passwordResetTokenRepository.deleteByUserId(user.id)

        const { token } = await this.passwordResetTokenRepository.create(
            PasswordResetToken.create({ ip, userId: user.id })
        )

        const name = escapeHtml(user.profile?.name ?? 'usuário')

        await this.emailService.sendEmail({
            to: { email: user.email, name: user.profile?.name },
            subject: 'Recuperação de senha',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
                    <h2 style="color: #000000; margin-bottom: 10px;">${escapeHtml(config.get('application.name'))}</h2>
                    <p style="color: #555555;">Olá ${name},</p>
                    <p style="color: #555555;">Recebemos um pedido para redefinir a sua senha. Use o código abaixo para continuar:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #000000;">${token}</span>
                    </div>
                    <p style="color: #777777; font-size: 12px;">O código é válido por ${PASSWORD_RESET_TOKEN_TTL_MINUTES} minutos. Se você não fez esse pedido, ignore este e-mail.</p>
                </div>
            `
        })
    }
}

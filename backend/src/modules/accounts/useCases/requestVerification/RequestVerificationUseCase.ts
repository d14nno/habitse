import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { config } from '@shared/config'
import { EmailService } from '@services/email/EmailService'
import { VerificationChannel } from '@modules/accounts/enums/VerificationChannel'
import { VerificationCodeRepository } from '@modules/accounts/repositories/VerificationCodeRepository'
import { VerificationCodeHasher } from '@modules/accounts/services/VerificationCodeHasher'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

export const VERIFICATION_CODE_TTL_MINUTES = 10
export const VERIFICATION_RESEND_SECONDS = 60

/** Envia um código de 6 dígitos para confirmar o e-mail. */
@injectable()
export class RequestVerificationUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject('VerificationCodeRepository')
        private verificationCodeRepository: VerificationCodeRepository,
        @inject('EmailService')
        private emailService: EmailService
    ) { }

    async execute(userId: number, channel: VerificationChannel): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: ['profile'] })

        const target = user.email

        const latest = await this.verificationCodeRepository.findLatest(userId, channel)

        if (latest && Date.now() - new Date(latest.createdAt).getTime() < VERIFICATION_RESEND_SECONDS * 1000) {
            throw new AppError(
                [{ message: `Aguarde ${VERIFICATION_RESEND_SECONDS} segundos para pedir um novo código`, uniqueCode: 'VERIFICATION:TOO_SOON' }],
                429
            )
        }

        const code = VerificationCodeHasher.generate()

        await this.verificationCodeRepository.create({
            userId,
            channel,
            target,
            codeHash: VerificationCodeHasher.hash(code),
            expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000)
        })

        const message = `Seu código de verificação ${config.get('application.name')} é ${code}. Ele expira em ${VERIFICATION_CODE_TTL_MINUTES} minutos.`

        await this.emailService.sendEmail({
            to: { email: target, name: user.profile?.name },
            subject: 'Código de verificação',
            html: `<p>${message}</p>`
        })
    }
}

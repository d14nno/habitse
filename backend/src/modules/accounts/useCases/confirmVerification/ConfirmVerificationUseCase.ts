import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { VerificationChannel } from '@modules/accounts/enums/VerificationChannel'
import { VerificationCodeRepository } from '@modules/accounts/repositories/VerificationCodeRepository'
import { VerificationCodeHasher } from '@modules/accounts/services/VerificationCodeHasher'
import { UserMapper } from '@modules/users/index/mappers/UserMapper'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

export const VERIFICATION_MAX_ATTEMPTS = 5

const invalidCode = () => new AppError([{ message: 'Código inválido ou expirado', uniqueCode: 'VERIFICATION:INVALID_CODE' }], 400)

@injectable()
export class ConfirmVerificationUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject('VerificationCodeRepository')
        private verificationCodeRepository: VerificationCodeRepository
    ) { }

    async execute(userId: number, channel: VerificationChannel, code: string) {
        const latest = await this.verificationCodeRepository.findLatest(userId, channel)

        if (!latest || new Date(latest.expiresAt) < new Date() || latest.attempts >= VERIFICATION_MAX_ATTEMPTS) {
            throw invalidCode()
        }

        if (!VerificationCodeHasher.matches(code, latest.codeHash)) {
            await this.verificationCodeRepository.incrementAttempts(latest.id)
            throw invalidCode()
        }

        await this.userRepository.update({ emailVerifiedAt: new Date() }, { where: { id: userId } })

        await this.verificationCodeRepository.deleteAll(userId, channel)

        return UserMapper.toHTTP(await this.userRepository.findOne({ where: { id: userId }, relations: ['profile'] }))
    }
}

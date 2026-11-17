import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { TwoFactorService } from '@modules/accounts/services/TwoFactorService'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

const invalidCode = () => new AppError([{ message: 'Código inválido', uniqueCode: '2FA:INVALID_CODE' }], 400)

/** POST /accounts/2fa — gera um novo segredo (ainda não ativo) */
@injectable()
export class SetupTwoFactorUseCase {
    constructor(@inject('UserRepository') private userRepository: UserRepository) { }

    async execute(userId: number) {
        const user = await this.userRepository.findWithPassword({ id: userId })

        if (user.twoFactorEnabled) {
            throw new AppError([{ message: 'A verificação em duas etapas já está ativa', uniqueCode: '2FA:ALREADY_ENABLED' }], 409)
        }

        const secret = TwoFactorService.generateSecret()

        await this.userRepository.update({ twoFactorSecret: secret, twoFactorEnabled: false }, { where: { id: userId } })

        return { secret, qrCode: await TwoFactorService.qrCode(user.email, secret) }
    }
}

/** PUT /accounts/2fa — confirma o código e ativa */
@injectable()
export class EnableTwoFactorUseCase {
    constructor(@inject('UserRepository') private userRepository: UserRepository) { }

    async execute(userId: number, code: string): Promise<void> {
        const user = await this.userRepository.findWithPassword({ id: userId })

        if (!TwoFactorService.verify(code, user.twoFactorSecret)) throw invalidCode()

        await this.userRepository.update({ twoFactorEnabled: true }, { where: { id: userId } })
    }
}

/** DELETE /accounts/2fa — exige um código válido para desativar */
@injectable()
export class DisableTwoFactorUseCase {
    constructor(@inject('UserRepository') private userRepository: UserRepository) { }

    async execute(userId: number, code: string): Promise<void> {
        const user = await this.userRepository.findWithPassword({ id: userId })

        if (!user.twoFactorEnabled || !TwoFactorService.verify(code, user.twoFactorSecret)) throw invalidCode()

        await this.userRepository.update({ twoFactorEnabled: false, twoFactorSecret: null }, { where: { id: userId } })
    }
}

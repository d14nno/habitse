import bcrypt from 'bcrypt'
import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'
import { PASSWORD_SALT_ROUNDS } from '@modules/accounts/useCases/register/RegisterAccountUseCase'

@injectable()
export class UpdatePasswordUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository
    ) { }

    async execute(userId: number, { passwordOld, password }: { passwordOld: string, password: string }): Promise<void> {
        const user = await this.userRepository.findWithPassword({ id: userId })

        const passwordIsCorrect = user?.password ? await bcrypt.compare(passwordOld, user.password) : false

        if (!passwordIsCorrect) {
            throw new AppError(
                [{ message: 'Senha atual incorreta', uniqueCode: 'UPDATE:PASSWORD:WRONG_CURRENT_PASSWORD' }],
                '401 Unauthorized'
            )
        }

        await this.userRepository.update(
            { password: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS) },
            { where: { id: userId } }
        )
    }
}

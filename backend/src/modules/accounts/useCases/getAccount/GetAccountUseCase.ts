import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { UserMapper } from '@modules/users/index/mappers/UserMapper'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'

@injectable()
export class GetAccountUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository
    ) { }

    async execute(userId: number) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['profile']
        })

        if (!user) {
            throw new AppError([{ message: 'Usuário não encontrado', uniqueCode: 'ACCOUNT:NOT_FOUND' }], 404)
        }

        return UserMapper.toHTTP(user)
    }
}

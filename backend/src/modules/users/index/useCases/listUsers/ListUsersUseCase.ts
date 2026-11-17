import { inject, injectable } from 'tsyringe'

import { mapPaginated, PaginationParams } from '@shared/types/Pagination'
import { UserMapper } from '@modules/users/index/mappers/UserMapper'
import { FindManyUsersOptions, UserRepository } from '@modules/users/index/repositories/UserRepository'

/** Listagem de usuários para o painel administrativo. */
@injectable()
export class ListUsersUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository
    ) { }

    async execute(filters: FindManyUsersOptions['where'], pagination: PaginationParams) {
        const users = await this.userRepository.findMany({
            where: filters,
            pagination,
            relations: ['profile']
        })

        return mapPaginated(users, user => UserMapper.toHTTP(user))
    }
}

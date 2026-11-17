import { Paginated, PaginationParams } from '@shared/types/Pagination'
import { UpdateUserDTO } from '../dtos/UpdateUserDTO'
import { User, UserStatus } from '../entities/User'
import { UserType } from '../enums/UserType'

export type UserRelation = 'profile'

export interface FindOneUserOptions {
    where: { email?: string, id?: number }
    relations?: UserRelation[]
}

export interface FindManyUsersOptions {
    where?: {
        type?: UserType
        status?: UserStatus
        /** Busca por nome ou e-mail */
        search?: string
        /** Só estes usuários (ex.: membros de uma imobiliária) */
        ids?: number[]
    }
    pagination: PaginationParams
    relations?: UserRelation[]
}

export interface UpdateUserOptions {
    where: { id: number }
}

export interface UserRepository {
    create(user: User): Promise<User>

    /** Nunca retorna a senha. */
    findOne(options: FindOneUserOptions): Promise<User | null>

    /** Mais recentes primeiro. Nunca retorna a senha. */
    findMany(options: FindManyUsersOptions): Promise<Paginated<User>>

    /** Retorna o usuário com o hash da senha (apenas para autenticação). */
    findWithPassword(where: { email?: string, id?: number }): Promise<User | null>

    update(data: UpdateUserDTO, options: UpdateUserOptions): Promise<boolean>
}

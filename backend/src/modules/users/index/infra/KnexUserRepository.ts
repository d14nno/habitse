import { db } from '@shared/infra/knex/transaction'
import { paginate } from '@shared/infra/knex/paginate'
import { Paginated } from '@shared/types/Pagination'
import { Profile } from '@modules/users/profiles/entities/Profile'
import { User } from '../entities/User'
import { UpdateUserDTO } from '../dtos/UpdateUserDTO'
import {
    FindManyUsersOptions,
    FindOneUserOptions,
    UpdateUserOptions,
    UserRelation,
    UserRepository
} from '../repositories/UserRepository'

const USERS = 'users.users'
const PROFILES = 'users.profiles'

/** Colunas sensíveis que nunca saem do repositório (exceto em findWithPassword) */
const stripSecrets = ({ password, twoFactorSecret, ...data }: any) => data

/**
 * Carrega usuários (sem senha/segredos) com as relações pedidas em lote, preservando a ordem dos ids.
 * Reutilize em outros repositórios que precisem anexar usuários aos seus registros.
 */
export async function loadUsersByIds(ids: number[], relations: UserRelation[] = []): Promise<Map<number, User>> {
    const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
    const users = new Map<number, User>()

    if (uniqueIds.length === 0) return users

    const [rows, profiles] = await Promise.all([
        db()(USERS).whereIn('id', uniqueIds).select('*'),
        relations.includes('profile') ? db()(PROFILES).whereIn('userId', uniqueIds).select('*') : []
    ])

    for (const id of uniqueIds) {
        const row = rows.find(item => item.id === id)

        if (!row) continue

        const profile = profiles.find(item => item.userId === id)

        users.set(id, new User({
            ...stripSecrets(row),
            profile: profile ? new Profile(profile) : undefined
        }))
    }

    return users
}

export class KnexUserRepository implements UserRepository {
    async create(user: User): Promise<User> {
        const { profile, ...data } = user.props

        const [{ id }] = await db()(USERS).insert(data).returning('id')

        user.id = id
        delete user.props.password

        return user
    }

    async findOne({ where, relations = [] }: FindOneUserOptions): Promise<User | null> {
        const query = db()(USERS).select('id').where('isDeleted', false)

        if (where.id) query.where('id', where.id)
        if (where.email) query.where('email', where.email.toLowerCase().trim())

        const result = await query.first()

        if (!result) return null

        const users = await loadUsersByIds([result.id], relations)

        return users.get(result.id) ?? null
    }

    async findMany({ where = {}, pagination, relations = [] }: FindManyUsersOptions): Promise<Paginated<User>> {
        // profiles é 1:1 com users, então o join não duplica linhas
        const query = db()(USERS)
            .select(`${USERS}.id`)
            .leftJoin(PROFILES, `${PROFILES}.userId`, `${USERS}.id`)
            .where(`${USERS}.isDeleted`, false)
            .orderBy(`${USERS}.createdAt`, 'desc')

        if (where.type) query.where(`${USERS}.type`, where.type)
        if (where.status) query.where(`${USERS}.status`, where.status)
        if (where.ids) query.whereIn(`${USERS}.id`, where.ids)

        if (where.search) {
            const term = `%${where.search.trim()}%`
            query.where(builder => builder
                .whereILike(`${USERS}.email`, term)
                .orWhereILike(`${PROFILES}.name`, term))
        }

        const result = await paginate<{ id: number }>(query, pagination)
        const ids = result.data.map(row => row.id)
        const users = await loadUsersByIds(ids, relations)

        return { data: ids.map(id => users.get(id)).filter(Boolean), pagination: result.pagination }
    }

    async findWithPassword(where: { email?: string, id?: number }): Promise<User | null> {
        const query = db()(USERS).where('isDeleted', false)

        if (where.id) query.where('id', where.id)
        if (where.email) query.where('email', where.email.toLowerCase().trim())

        const result = await query.first()

        // Única leitura com senha e segredo de 2FA (autenticação)
        return result ? new User(result) : null
    }

    async update(data: UpdateUserDTO, options: UpdateUserOptions): Promise<boolean> {
        const rows = await db()(USERS)
            .where(options.where)
            .update({ ...data, updatedAt: new Date() })

        return rows > 0
    }
}

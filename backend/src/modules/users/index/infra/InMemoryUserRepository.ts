import { User } from '../entities/User'
import { UpdateUserDTO } from '../dtos/UpdateUserDTO'
import { Paginated } from '@shared/types/Pagination'
import { FindManyUsersOptions, FindOneUserOptions, UpdateUserOptions, UserRepository } from '../repositories/UserRepository'
import { InMemoryProfileRepository } from '@modules/users/profiles/infra/InMemoryProfileRepository'

export class InMemoryUserRepository implements UserRepository {
    public users: User[] = []
    private idCounter = 1

    constructor(private profileRepository?: InMemoryProfileRepository) { }

    async create(user: User): Promise<User> {
        user.id = this.idCounter++
        this.users.push(new User({ ...user.props }))
        delete user.props.password
        return user
    }

    private find(where: { email?: string, id?: number }) {
        return this.users.find(user =>
            !user.isDeleted &&
            (!where.id || user.id === where.id) &&
            (!where.email || user.email === where.email.toLowerCase().trim())
        )
    }

    async findOne({ where, relations = [] }: FindOneUserOptions): Promise<User | null> {
        const user = this.find(where)

        if (!user) return null

        const { password, ...props } = user.props

        return new User({
            ...props,
            profile: relations.includes('profile') ? await this.profileRepository?.findOne({ where: { userId: user.id } }) : undefined
        })
    }

    async findMany({ where = {}, pagination: { page, perPage }, relations = [] }: FindManyUsersOptions): Promise<Paginated<User>> {
        const matches: User[] = []

        for (const user of [...this.users].reverse()) {
            const full = await this.findOne({ where: { id: user.id }, relations: ['profile'] })
            const search = where.search?.toLowerCase()

            if (
                full &&
                (!where.type || full.type === where.type) &&
                (!where.status || full.status === where.status) &&
                (!where.ids || where.ids.includes(full.id)) &&
                (!search || full.email.includes(search) || full.profile?.name.toLowerCase().includes(search))
            ) {
                matches.push(await this.findOne({ where: { id: user.id }, relations }))
            }
        }

        return {
            data: matches.slice((page - 1) * perPage, page * perPage),
            pagination: { page, perPage, total: matches.length, lastPage: Math.max(1, Math.ceil(matches.length / perPage)) }
        }
    }

    async findWithPassword(where: { email?: string, id?: number }): Promise<User | null> {
        const user = this.find(where)
        return user ? new User({ ...user.props }) : null
    }

    async update(data: UpdateUserDTO, { where }: UpdateUserOptions): Promise<boolean> {
        const index = this.users.findIndex(user => user.id === where.id)

        if (index === -1) return false

        this.users[index] = new User({ ...this.users[index].props, ...data, updatedAt: new Date() })

        return true
    }
}

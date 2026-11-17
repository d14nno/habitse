import { db } from '@shared/infra/knex/transaction'
import { FindOneProfileOptions, ProfileRepository, UpdateProfileOptions } from '../repositories/ProfileRepository'
import { Profile } from '../entities/Profile'
import { UpdateProfileDTO } from '../dto/UpdateProfileDTO'

export class KnexProfileRepository implements ProfileRepository {
    private table = 'users.profiles'

    async create(profile: Profile) {
        const [{ id }] = await db()(this.table).insert(profile.props).returning('id')

        profile.id = id

        return profile
    }

    async update(data: UpdateProfileDTO, options: UpdateProfileOptions) {
        const rows = await db()(this.table)
            .where(options.where)
            .update({ ...data, updatedAt: new Date() })

        return rows > 0
    }

    async findOne({ where }: FindOneProfileOptions) {
        const result = await db()(this.table).where(where).first()

        return result ? new Profile(result) : null
    }
}

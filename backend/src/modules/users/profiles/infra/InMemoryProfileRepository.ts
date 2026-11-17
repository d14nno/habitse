import { FindOneProfileOptions, ProfileRepository, UpdateProfileOptions } from '../repositories/ProfileRepository'
import { Profile } from '../entities/Profile'
import { UpdateProfileDTO } from '../dto/UpdateProfileDTO'

export class InMemoryProfileRepository implements ProfileRepository {
    public profiles: Profile[] = []
    private idCounter = 1

    async create(profile: Profile): Promise<Profile> {
        profile.id = this.idCounter++
        this.profiles.push(profile)
        return profile
    }

    async update(data: UpdateProfileDTO, { where }: UpdateProfileOptions): Promise<boolean> {
        const index = this.profiles.findIndex(profile => profile.userId === where.userId)

        if (index === -1) return false

        this.profiles[index] = new Profile({ ...this.profiles[index].props, ...data, updatedAt: new Date() })

        return true
    }

    async findOne({ where }: FindOneProfileOptions): Promise<Profile | null> {
        return this.profiles.find(profile => profile.userId === where.userId) ?? null
    }
}

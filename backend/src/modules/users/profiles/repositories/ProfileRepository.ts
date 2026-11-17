import { Profile } from '../entities/Profile'
import { UpdateProfileDTO } from '../dto/UpdateProfileDTO'

export interface FindOneProfileOptions {
    where: { userId: number }
}

export interface UpdateProfileOptions {
    where: { userId: number }
}

export interface ProfileRepository {
    create(profile: Profile): Promise<Profile>
    update(data: UpdateProfileDTO, options: UpdateProfileOptions): Promise<boolean>
    findOne(options: FindOneProfileOptions): Promise<Profile | null>
}

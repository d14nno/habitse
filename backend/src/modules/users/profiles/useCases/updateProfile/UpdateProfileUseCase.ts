import { inject, injectable } from 'tsyringe'
import { AppError } from '@shared/utils/AppError'
import { ProfileRepository } from '@modules/users/profiles/repositories/ProfileRepository'
import { UpdateProfileDTO } from '@modules/users/profiles/dto/UpdateProfileDTO'

@injectable()
export class UpdateProfileUseCase {
    constructor(
        @inject('ProfileRepository')
        private profileRepository: ProfileRepository
    ) { }

    async execute(userId: number, data: Pick<UpdateProfileDTO, 'name' | 'phoneNumber' | 'document' | 'birthDate'>): Promise<void> {
        const profile = await this.profileRepository.findOne({ where: { userId } })

        if (!profile) {
            throw new AppError([{ message: 'Perfil não encontrado', uniqueCode: 'PROFILE:NOT_FOUND' }], 404)
        }

        await this.profileRepository.update(data, { where: { userId } })
    }
}

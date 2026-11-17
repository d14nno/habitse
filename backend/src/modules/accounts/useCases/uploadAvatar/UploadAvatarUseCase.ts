import { inject, injectable } from 'tsyringe'

import { StorageService, UploadFileDTO } from '@services/storage/StorageService'
import { ProfileRepository } from '@modules/users/profiles/repositories/ProfileRepository'

@injectable()
export class UploadAvatarUseCase {
    constructor(
        @inject('ProfileRepository')
        private profileRepository: ProfileRepository,
        @inject('StorageService')
        private storageService: StorageService
    ) { }

    async execute(userId: number, file: UploadFileDTO): Promise<{ avatarUrl: string }> {
        const profile = await this.profileRepository.findOne({ where: { userId } })

        const stored = await this.storageService.upload(file, 'avatars', { maxImageWidth: 512 })

        await this.profileRepository.update({ avatarUrl: stored.url, avatarKey: stored.key }, { where: { userId } })

        // Remove a foto anterior depois de gravar a nova
        if (profile?.props.avatarKey) await this.storageService.delete(profile.props.avatarKey)

        return { avatarUrl: stored.url }
    }
}

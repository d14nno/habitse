import bcrypt from 'bcrypt'
import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { UnitOfWork } from '@shared/types/UnitOfWork'
import { RegisterAccountDTO } from '@modules/accounts/dtos/RegisterAccountDTO'
import { SessionTokenService } from '@modules/accounts/services/SessionTokenService'
import { User } from '@modules/users/index/entities/User'
import { UserType } from '@modules/users/index/enums/UserType'
import { UserMapper } from '@modules/users/index/mappers/UserMapper'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'
import { Profile } from '@modules/users/profiles/entities/Profile'
import { ProfileRepository } from '@modules/users/profiles/repositories/ProfileRepository'

export const PASSWORD_SALT_ROUNDS = 10

/** Cadastro público: cria o usuário e o perfil e já abre a sessão. */
@injectable()
export class RegisterAccountUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject('ProfileRepository')
        private profileRepository: ProfileRepository,
        @inject(SessionTokenService)
        private sessionTokenService: SessionTokenService,
        @inject('UnitOfWork')
        private unitOfWork: UnitOfWork
    ) { }

    async execute(userAgent: unknown, ip: string, { email, password, name, phoneNumber, document, birthDate }: RegisterAccountDTO) {
        if (await this.userRepository.findOne({ where: { email } })) {
            throw new AppError([{ message: 'E-mail já cadastrado', uniqueCode: 'ACCOUNT:EMAIL_ALREADY_EXISTS' }], 409)
        }

        const hash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
        const user = await this.unitOfWork.run(async () => {
            const created = await this.userRepository.create(User.create({ email, type: UserType.USER, password: hash }))

            created.profile = await this.profileRepository.create(
                Profile.create({ userId: created.id, name, phoneNumber: phoneNumber ?? null, document: document ?? null, birthDate: birthDate ?? null })
            )

            return created
        })

        const tokens = await this.sessionTokenService.createSession(user, userAgent, ip)

        return {
            user: UserMapper.toHTTP(user),
            ...tokens
        }
    }
}

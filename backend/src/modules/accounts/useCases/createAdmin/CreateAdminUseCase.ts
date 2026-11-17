import bcrypt from 'bcrypt'
import { inject, injectable } from 'tsyringe'

import { AppError } from '@shared/utils/AppError'
import { PASSWORD_SALT_ROUNDS } from '@modules/accounts/useCases/register/RegisterAccountUseCase'
import { User } from '@modules/users/index/entities/User'
import { AdminRole } from '@modules/users/index/enums/AdminRole'
import { UserType } from '@modules/users/index/enums/UserType'
import { UserMapper } from '@modules/users/index/mappers/UserMapper'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'
import { Profile } from '@modules/users/profiles/entities/Profile'
import { ProfileRepository } from '@modules/users/profiles/repositories/ProfileRepository'

/** Cria um administrador do painel. Usado por `npm run admin:create` e por POST /admin/admins. */
@injectable()
export class CreateAdminUseCase {
    constructor(
        @inject('UserRepository')
        private userRepository: UserRepository,
        @inject('ProfileRepository')
        private profileRepository: ProfileRepository
    ) { }

    async execute({ email, password, name, adminRole = AdminRole.SUPER_ADMIN }: { email: string, password: string, name: string, adminRole?: AdminRole }) {
        if (!email || !name || !password || password.length < 8) {
            throw new AppError([{ message: 'Informe e-mail, nome e senha (mínimo 8 caracteres)', uniqueCode: 'ADMIN:INVALID_DATA' }], 400)
        }

        if (await this.userRepository.findOne({ where: { email } })) {
            throw new AppError([{ message: 'E-mail já cadastrado', uniqueCode: 'ACCOUNT:EMAIL_ALREADY_EXISTS' }], 409)
        }

        const user = await this.userRepository.create(
            User.create({ email, type: UserType.ADMIN, adminRole, password: await bcrypt.hash(password, PASSWORD_SALT_ROUNDS) })
        )

        user.profile = await this.profileRepository.create(Profile.create({ userId: user.id, name, phoneNumber: null }))

        return UserMapper.toHTTP(user)
    }
}

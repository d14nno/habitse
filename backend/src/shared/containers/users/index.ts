import { container } from 'tsyringe'
import { KnexUnitOfWork } from '@shared/infra/knex/transaction'
import { UnitOfWork } from '@shared/types/UnitOfWork'
import { KnexUserRepository } from '@modules/users/index/infra/KnexUserRepository'
import { UserRepository } from '@modules/users/index/repositories/UserRepository'
import { KnexProfileRepository } from '@modules/users/profiles/infra/KnexProfileRepository'
import { ProfileRepository } from '@modules/users/profiles/repositories/ProfileRepository'

container.registerSingleton<UserRepository>('UserRepository', KnexUserRepository)
container.registerSingleton<ProfileRepository>('ProfileRepository', KnexProfileRepository)
// Transações entre repositórios (cadastro: usuário + perfil)
container.registerSingleton<UnitOfWork>('UnitOfWork', KnexUnitOfWork)

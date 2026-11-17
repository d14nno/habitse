import { User } from '../entities/User'
import { permissionsOf } from '../enums/AdminRole'

/**
 * Formato público do usuário nas respostas HTTP.
 * Nunca inclui senha nem segredo de 2FA.
 */
export class UserMapper {
    static toHTTP(user: User) {
        const { props } = user

        return {
            id: user.id,
            email: user.email,
            type: user.type,
            status: user.status,
            emailVerifiedAt: props.emailVerifiedAt ?? null,
            twoFactorEnabled: user.twoFactorEnabled,
            adminRole: user.adminRole,
            permissions: permissionsOf(user.adminRole),
            createdAt: user.createdAt,
            profile: user.profile
                ? {
                    name: user.profile.name,
                    phoneNumber: user.profile.phoneNumber,
                    document: user.profile.document,
                    birthDate: user.profile.birthDate,
                    avatarUrl: user.profile.avatarUrl
                }
                : null
        }
    }

    /** Versão reduzida para exibir um usuário a outro (sem e-mail, documento ou dados de conta). */
    static toPublic(user?: User | null) {
        if (!user) return null

        return {
            id: user.id,
            name: user.profile?.name ?? null,
            avatarUrl: user.profile?.avatarUrl ?? null
        }
    }
}

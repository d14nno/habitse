import { Session, SessionProps } from '@modules/accounts/entities/Session'

export type UpdateSessionDTO = Partial<Pick<SessionProps, 'accessToken' | 'refreshToken' | 'expiresAt'>>

export interface SessionRepository {
    create(session: Session): Promise<Session>

    update(data: UpdateSessionDTO, options: { where: { id: number } }): Promise<boolean>

    findOne(options: { where: { id: number } }): Promise<Session | null>

    /** Ids das sessões ainda não expiradas do usuário */
    findActiveIds(userId: number): Promise<number[]>

    /** Expira todas as sessões do usuário */
    expireAll(userId: number): Promise<void>
}

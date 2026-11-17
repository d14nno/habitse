import { Session } from '@modules/accounts/entities/Session'
import { SessionRepository, UpdateSessionDTO } from '@modules/accounts/repositories/SessionRepository'
import { connection } from '@shared/infra/knex'

export class KnexSessionRepository implements SessionRepository {
    private table = 'users.sessions'

    async create(session: Session): Promise<Session> {
        const [{ id }] = await connection(this.table).insert(session.props).returning('id')

        session.id = id

        return session
    }

    async update(data: UpdateSessionDTO, options: { where: { id: number } }): Promise<boolean> {
        const rows = await connection(this.table)
            .where(options.where)
            .update({ ...data, updatedAt: new Date() })

        return rows > 0
    }

    async findOne(options: { where: { id: number } }): Promise<Session | null> {
        const result = await connection(this.table).where(options.where).first()

        return result ? new Session(result) : null
    }

    async findActiveIds(userId: number): Promise<number[]> {
        const rows = await connection(this.table)
            .where({ userId })
            .where('expiresAt', '>', new Date())
            .select('id')

        return rows.map(row => row.id)
    }

    async expireAll(userId: number): Promise<void> {
        await connection(this.table)
            .where({ userId })
            .where('expiresAt', '>', new Date())
            .update({ expiresAt: new Date(), updatedAt: new Date() })
    }
}

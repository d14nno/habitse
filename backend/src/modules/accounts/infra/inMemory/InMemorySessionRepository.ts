import { Session } from '@modules/accounts/entities/Session'
import { SessionRepository, UpdateSessionDTO } from '@modules/accounts/repositories/SessionRepository'

export class InMemorySessionRepository implements SessionRepository {
    public sessions: Session[] = []
    private idCounter = 1

    async create(session: Session): Promise<Session> {
        session.id = this.idCounter++
        this.sessions.push(new Session({ ...session.props }))
        return session
    }

    async update(data: UpdateSessionDTO, { where }: { where: { id: number } }): Promise<boolean> {
        const index = this.sessions.findIndex(session => session.id === where.id)

        if (index === -1) return false

        this.sessions[index] = new Session({ ...this.sessions[index].props, ...data, updatedAt: new Date() })

        return true
    }

    async findOne({ where }: { where: { id: number } }): Promise<Session | null> {
        return this.sessions.find(session => session.id === where.id) ?? null
    }

    async findActiveIds(userId: number): Promise<number[]> {
        return this.sessions.filter(session => session.userId === userId && !session.isExpired()).map(session => session.id)
    }

    async expireAll(userId: number): Promise<void> {
        for (const id of await this.findActiveIds(userId)) {
            await this.update({ expiresAt: new Date() }, { where: { id } })
        }
    }
}

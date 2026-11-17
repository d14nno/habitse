import { connection } from '@shared/infra/knex'
import { VerificationChannel } from '@modules/accounts/enums/VerificationChannel'
import { VerificationCode, VerificationCodeRepository } from '@modules/accounts/repositories/VerificationCodeRepository'

export class KnexVerificationCodeRepository implements VerificationCodeRepository {
    private table = 'users.verification_codes'

    async create(data: Omit<VerificationCode, 'id' | 'attempts' | 'createdAt'>): Promise<void> {
        await connection(this.table).insert(data)
    }

    async findLatest(userId: number, channel: VerificationChannel): Promise<VerificationCode | null> {
        return (await connection(this.table).where({ userId, channel }).orderBy('createdAt', 'desc').first()) ?? null
    }

    async incrementAttempts(id: number): Promise<void> {
        await connection(this.table).where({ id }).increment('attempts', 1)
    }

    async deleteAll(userId: number, channel: VerificationChannel): Promise<void> {
        await connection(this.table).where({ userId, channel }).delete()
    }
}

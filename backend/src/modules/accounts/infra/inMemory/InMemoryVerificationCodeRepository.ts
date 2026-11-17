import { VerificationChannel } from '@modules/accounts/enums/VerificationChannel'
import { VerificationCode, VerificationCodeRepository } from '@modules/accounts/repositories/VerificationCodeRepository'

export class InMemoryVerificationCodeRepository implements VerificationCodeRepository {
    public codes: VerificationCode[] = []
    private idCounter = 1

    async create(data: Omit<VerificationCode, 'id' | 'attempts' | 'createdAt'>): Promise<void> {
        this.codes.push({ ...data, id: this.idCounter++, attempts: 0, createdAt: new Date() })
    }

    async findLatest(userId: number, channel: VerificationChannel): Promise<VerificationCode | null> {
        return [...this.codes].reverse().find(code => code.userId === userId && code.channel === channel) ?? null
    }

    async incrementAttempts(id: number): Promise<void> {
        const code = this.codes.find(item => item.id === id)
        if (code) code.attempts++
    }

    async deleteAll(userId: number, channel: VerificationChannel): Promise<void> {
        this.codes = this.codes.filter(code => !(code.userId === userId && code.channel === channel))
    }
}

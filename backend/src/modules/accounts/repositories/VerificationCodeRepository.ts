import { VerificationChannel } from '../enums/VerificationChannel'

export interface VerificationCode {
    id: number
    userId: number
    channel: VerificationChannel
    target: string
    codeHash: string
    attempts: number
    expiresAt: Date
    createdAt: Date
}

export interface VerificationCodeRepository {
    create(data: Omit<VerificationCode, 'id' | 'attempts' | 'createdAt'>): Promise<void>
    findLatest(userId: number, channel: VerificationChannel): Promise<VerificationCode | null>
    incrementAttempts(id: number): Promise<void>
    deleteAll(userId: number, channel: VerificationChannel): Promise<void>
}

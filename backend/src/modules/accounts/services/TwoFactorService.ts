import { randomUUID } from 'crypto'
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

import { config } from '@shared/config'
import { cacheKey, RedisCache } from '@shared/infra/redis'

const CHALLENGE_TTL_SECONDS = 5 * 60
const CHALLENGE_MAX_ATTEMPTS = 5
const challengeKey = (token: string) => cacheKey('2fa-login', token)

interface LoginChallenge {
    userId: number
    attempts: number
}

authenticator.options = { window: 1 }

/** TOTP (Google Authenticator etc.) e o desafio temporário do login em duas etapas. */
export const TwoFactorService = {
    generateSecret(): string {
        return authenticator.generateSecret()
    },

    async qrCode(email: string, secret: string): Promise<string> {
        return QRCode.toDataURL(authenticator.keyuri(email, config.get('application.name'), secret))
    },

    verify(code: string, secret?: string | null): boolean {
        return !!secret && authenticator.check(code, secret)
    },

    async createLoginChallenge(userId: number): Promise<string> {
        const token = randomUUID()
        await RedisCache.set(challengeKey(token), { userId, attempts: 0 } as LoginChallenge, CHALLENGE_TTL_SECONDS)
        return token
    },

    /** Retorna o userId se o desafio existir; registra a tentativa (máx. 5) */
    async consumeAttempt(token: string): Promise<number | null> {
        const challenge = await RedisCache.get<LoginChallenge>(challengeKey(token))

        if (!challenge || challenge.attempts >= CHALLENGE_MAX_ATTEMPTS) return null

        await RedisCache.set(challengeKey(token), { ...challenge, attempts: challenge.attempts + 1 }, CHALLENGE_TTL_SECONDS)

        return challenge.userId
    },

    async finishChallenge(token: string): Promise<void> {
        await RedisCache.delete(challengeKey(token))
    }
}

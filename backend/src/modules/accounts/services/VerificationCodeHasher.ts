import { createHash, randomInt, timingSafeEqual } from 'crypto'
import { config } from '@shared/config'

/** Códigos curtos de verificação: gerados aqui e guardados apenas como hash. */
export const VerificationCodeHasher = {
    generate(length = 6): string {
        return randomInt(0, 10 ** length).toString().padStart(length, '0')
    },

    hash(code: string): string {
        return createHash('sha256').update(`${code}:${config.get('hashAuthSecret')}`).digest('hex')
    },

    matches(code: string, hash: string): boolean {
        const candidate = Buffer.from(this.hash(code))
        const expected = Buffer.from(hash)

        return candidate.length === expected.length && timingSafeEqual(candidate, expected)
    }
}

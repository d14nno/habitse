import { inject, injectable } from 'tsyringe'

import { RedisCache } from '@shared/infra/redis'
import { sessionCacheKey } from '@shared/infra/http/middleware/Auth'
import { generateToken } from '@shared/utils/generateToken'
import { GeoLocationService } from '@services/geoLocation/GeoLocationService'
import { User } from '@modules/users/index/entities/User'
import { Session } from '../entities/Session'
import { SessionProvider } from '../enums/SessionProvider'
import { SessionRepository } from '../repositories/SessionRepository'
import { AuthTokensDTO } from '../dtos/AuthTokensDTO'

export const ACCESS_TOKEN_TTL_SECONDS = 3 * 60 * 60 // 3 horas
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 dias

/**
 * Centraliza a emissão de tokens: cria/renova/revoga sessões e mantém o registro
 * da sessão ativa no Redis (consultado pelo middleware de autenticação).
 */
@injectable()
export class SessionTokenService {
    constructor(
        @inject('SessionRepository')
        private sessionRepository: SessionRepository,
        @inject('GeoLocationService')
        private geoLocationService: GeoLocationService
    ) { }

    async createSession(user: User, userAgent: unknown, ip: string): Promise<AuthTokensDTO> {
        const geo = await this.geoLocationService.getGeoData(ip)

        const session = await this.sessionRepository.create(
            Session.create({
                userId: user.id,
                provider: SessionProvider.PASSWORD,
                userAgent: JSON.stringify({ userAgent, geo }),
                ip,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)
            })
        )

        return this.issueTokens(user, session.id)
    }

    async renewSession(user: User, sessionId: number): Promise<AuthTokensDTO> {
        return this.issueTokens(user, sessionId)
    }

    async revokeSession(sessionId: number): Promise<void> {
        await RedisCache.delete(sessionCacheKey(sessionId))
        await this.sessionRepository.update({ expiresAt: new Date() }, { where: { id: sessionId } })
    }

    /** Encerra todas as sessões do usuário (ex.: bloqueio pelo administrador) */
    async revokeAllUserSessions(userId: number): Promise<void> {
        const sessionIds = await this.sessionRepository.findActiveIds(userId)

        await Promise.all(sessionIds.map(sessionId => RedisCache.delete(sessionCacheKey(sessionId))))
        await this.sessionRepository.expireAll(userId)
    }

    private async issueTokens(user: User, sessionId: number): Promise<AuthTokensDTO> {
        const token = generateToken(
            { kind: 'access', id: user.id, email: user.email, type: user.type, adminRole: user.adminRole ?? null, sessionId },
            ACCESS_TOKEN_TTL_SECONDS
        )

        const refreshToken = generateToken(
            { kind: 'refresh', id: user.id, sessionId },
            REFRESH_TOKEN_TTL_SECONDS
        )

        await this.sessionRepository.update(
            {
                accessToken: token,
                refreshToken,
                expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000)
            },
            { where: { id: sessionId } }
        )

        await RedisCache.set(sessionCacheKey(sessionId), sessionId, REFRESH_TOKEN_TTL_SECONDS)

        return {
            sessionId,
            token,
            refreshToken,
            tokenExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000)
        }
    }
}

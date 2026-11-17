/* eslint-disable consistent-return */
import { NextFunction, Request, Response } from '@shared/types/Express'
import { AppError } from '@shared/utils/AppError'
import { cacheKey, RedisCache } from '@shared/infra/redis'
import { AccessTokenPayload, decodeToken } from '@shared/utils/generateToken'
import { UserType } from '@modules/users/index/enums/UserType'
import { Permission, permissionsOf } from '@modules/users/index/enums/AdminRole'

export const sessionCacheKey = (sessionId: number) => cacheKey('session', sessionId)

/**
 * Valida um access token (assinatura, expiração e sessão ativa no Redis).
 * Reutilizável fora do HTTP (ex.: handshake de socket, se o projeto tiver tempo real).
 */
export async function verifyAccessToken(token: string): Promise<Express.Auth.User> {
    const decoded = decodeToken<AccessTokenPayload>(token, 'access')

    if (!decoded) {
        throw new AppError(
            [{ message: 'Token inválido', uniqueCode: 'TOKEN:INVALID' }],
            '401 Unauthorized'
        )
    }

    const sessionExist = await RedisCache.exists(sessionCacheKey(decoded.sessionId))

    if (!sessionExist) {
        throw new AppError(
            [{ message: 'Sessão expirada', uniqueCode: 'TOKEN:EXPIRED' }],
            '401 Unauthorized'
        )
    }

    return {
        id: decoded.id,
        email: decoded.email,
        type: decoded.type,
        adminRole: decoded.adminRole ?? null,
        sessionId: decoded.sessionId
    }
}

export function extractBearerToken(authorization?: string): string {
    if (!authorization) {
        throw new AppError(
            [{ message: 'Token não fornecido', uniqueCode: 'TOKEN:NO_PROVIDED' }],
            '401 Unauthorized'
        )
    }

    const [scheme, token] = authorization.split(' ')

    if (!token || !/^Bearer$/i.test(scheme)) {
        throw new AppError(
            [{ message: 'Token mal-formatado', uniqueCode: 'TOKEN:UN_FORMATTED' }],
            '401 Unauthorized'
        )
    }

    return token
}

export const headerAuth = ({ requireAuth = true }: { requireAuth?: boolean } = {}) => {
    return async (request: Request, response: Response, next: NextFunction): Promise<Response | void> => {
        try {
            // Rotas com autenticação opcional seguem sem usuário quando não há header
            if (!request.headers.authorization && !requireAuth) {
                return next()
            }

            const token = extractBearerToken(request.headers.authorization)

            request.authenticatedUser = await verifyAccessToken(token)

            next()
        } catch (error) {
            if (error instanceof AppError) {
                return response.status(error.statusCode).json({ errors: error.errors })
            }

            return response.status(401).json({
                errors: [{ uniqueCode: 'ERROR:INTERNAL', message: error?.message ?? 'Erro interno' }]
            })
        }
    }
}

/**
 * Restringe a rota a um tipo de usuário.
 * Deve ser usado depois do headerAuth().
 */
export const ensureUserType = (...types: UserType[]) => {
    return (request: Request, response: Response, next: NextFunction): Response | void => {
        if (!request.authenticatedUser || !types.includes(request.authenticatedUser.type)) {
            return response.status(403).json({
                errors: [{
                    message: 'Recurso não disponível para este tipo de usuário',
                    uniqueCode: 'AUTH:USER_TYPE_FORBIDDEN'
                }]
            })
        }

        next()
    }
}

/**
 * Restringe rotas do admin a uma permissão do papel do administrador.
 * Deve ser usado depois de headerAuth() + ensureUserType(UserType.ADMIN).
 */
export const ensurePermission = (permission: Permission) => {
    return (request: Request, response: Response, next: NextFunction): Response | void => {
        if (!permissionsOf(request.authenticatedUser?.adminRole).includes(permission)) {
            return response.status(403).json({
                errors: [{
                    message: 'Você não tem permissão para esta ação',
                    uniqueCode: 'AUTH:PERMISSION_DENIED',
                    details: { permission }
                }]
            })
        }

        next()
    }
}

/** Dados do administrador para auditoria */
export const adminActor = (request: Request) => ({ id: request.authenticatedUser.id, ip: request.userIp })

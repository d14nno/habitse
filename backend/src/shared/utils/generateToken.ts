import jwt from 'jsonwebtoken'

import { config } from '@shared/config'
import { UserType } from '@modules/users/index/enums/UserType'
import { AdminRole } from '@modules/users/index/enums/AdminRole'

export type TokenKind = 'access' | 'refresh'

export interface AccessTokenPayload {
    kind: 'access'
    id: number
    email: string
    type: UserType
    adminRole?: AdminRole | null
    sessionId: number
}

export interface RefreshTokenPayload {
    kind: 'refresh'
    id: number
    sessionId: number
}

export type TokenPayload = AccessTokenPayload | RefreshTokenPayload

function generateToken(
    payload: TokenPayload,
    expiresIn: number,
    key = config.get('hashAuthSecret')
): string {
    return jwt.sign({ data: payload }, key, {
        expiresIn,
        keyid: String(payload.id)
    })
}

/**
 * Valida a assinatura/expiração do token e garante que ele é do tipo esperado
 * (um refresh token não pode ser usado como access token e vice-versa).
 * Retorna null quando o token é inválido.
 */
function decodeToken<T extends TokenPayload>(
    token: string,
    kind: T['kind'],
    key = config.get('hashAuthSecret')
): T | null {
    try {
        const decoded = jwt.verify(token, key) as { data?: TokenPayload }

        if (!decoded?.data || decoded.data.kind !== kind) return null

        return decoded.data as T
    } catch {
        return null
    }
}

export { generateToken, decodeToken }

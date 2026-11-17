export interface AuthTokensDTO {
    sessionId: number
    token: string
    refreshToken: string
    tokenExpiresAt: Date
}

import { SessionProvider } from '../enums/SessionProvider'

export interface SessionProps {
    id?: number
    userId: number
    provider: SessionProvider
    accessToken?: string
    refreshToken?: string
    userAgent: Record<string, any> | string
    ip: string
    expiresAt: Date
    createdAt?: Date
    updatedAt?: Date
}

export class Session {
    private _props: SessionProps

    constructor(props: SessionProps) {
        this._props = props
    }

    get props() {
        return this._props
    }

    get id() {
        return this._props.id
    }

    set id(id: number) {
        this._props.id = id
    }

    get userId() {
        return this._props.userId
    }

    get expiresAt() {
        return this._props.expiresAt
    }

    isExpired() {
        // >=: revogar grava expiresAt = agora, e a sessão já deve valer como expirada no mesmo milissegundo
        return !this._props.expiresAt || Date.now() >= new Date(this._props.expiresAt).getTime()
    }

    static create(props: SessionProps) {
        return new Session({
            ...props,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date()
        })
    }
}

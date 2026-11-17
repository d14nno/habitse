import { randomInt } from 'crypto'

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 15

export interface PasswordResetTokenProps {
    id?: number
    /** Código numérico de 6 dígitos enviado por e-mail */
    token: string
    userId: number
    ip: string
    createdAt?: Date
}

export class PasswordResetToken {
    private _props: PasswordResetTokenProps

    constructor(props: PasswordResetTokenProps) {
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

    get token() {
        return this._props.token
    }

    get userId() {
        return this._props.userId
    }

    get createdAt() {
        return this._props.createdAt
    }

    isExpired(): boolean {
        if (!this._props.createdAt) return true

        const diffMinutes = (Date.now() - new Date(this._props.createdAt).getTime()) / 1000 / 60

        return diffMinutes > PASSWORD_RESET_TOKEN_TTL_MINUTES
    }

    static create(props: Omit<PasswordResetTokenProps, 'token' | 'createdAt'>) {
        return new PasswordResetToken({
            ...props,
            token: randomInt(100000, 1000000).toString(),
            createdAt: new Date()
        })
    }
}

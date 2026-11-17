import { Profile } from '@modules/users/profiles/entities/Profile'
import { UserType } from '../enums/UserType'
import { AdminRole } from '../enums/AdminRole'

export type UserStatus = 'pending' | 'active' | 'inactive'

export interface UserProps {
    id?: number
    email: string
    password?: string
    type: UserType
    status: UserStatus
    adminRole?: AdminRole | null
    emailVerifiedAt?: Date | null
    twoFactorSecret?: string | null
    twoFactorEnabled?: boolean

    createdAt?: Date
    updatedAt?: Date
    deletedAt?: Date | null
    isDeleted?: boolean

    profile?: Profile
}

export class User {
    private _props: UserProps

    constructor(props: UserProps) {
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

    get email() {
        return this._props.email
    }

    get password() {
        return this._props.password
    }

    set password(password: string) {
        this._props.password = password
    }

    get type() {
        return this._props.type
    }

    get status() {
        return this._props.status
    }

    get adminRole() {
        return this._props.adminRole ?? null
    }

    get isAdmin() {
        return this._props.type === UserType.ADMIN
    }

    get twoFactorEnabled() {
        return this._props.twoFactorEnabled ?? false
    }

    get twoFactorSecret() {
        return this._props.twoFactorSecret ?? null
    }

    get createdAt() {
        return this._props.createdAt ?? new Date()
    }

    get updatedAt() {
        return this._props.updatedAt
    }

    get isDeleted() {
        return this._props.isDeleted ?? false
    }

    get profile() {
        return this._props.profile
    }

    set profile(profile: Profile) {
        this._props.profile = profile
    }

    static create(props: Omit<UserProps, 'isDeleted' | 'deletedAt' | 'status'>) {
        return new User({
            ...props,
            email: props.email.toLowerCase().trim(),
            status: 'active',
            twoFactorEnabled: false,
            isDeleted: false,
            createdAt: props.createdAt ?? new Date(),
            updatedAt: props.updatedAt ?? new Date(),
            deletedAt: null
        })
    }
}

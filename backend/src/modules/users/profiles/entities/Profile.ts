export interface ProfileProps {
    id?: number
    userId: number
    name: string
    phoneNumber?: string | null
    /** CPF (somente dígitos) */
    document?: string | null
    birthDate?: string | Date | null
    avatarUrl?: string | null
    avatarKey?: string | null
    createdAt?: Date
    updatedAt?: Date
}

export class Profile {
    private _props: ProfileProps

    constructor(props: ProfileProps) {
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

    get name() {
        return this._props.name
    }

    get firstName() {
        return this._props.name?.split(' ')[0] ?? null
    }

    get phoneNumber() {
        return this._props.phoneNumber ?? null
    }

    get document() {
        return this._props.document ?? null
    }

    get avatarUrl() {
        return this._props.avatarUrl ?? null
    }

    /** YYYY-MM-DD */
    get birthDate() {
        const value = this._props.birthDate
        if (!value) return null
        return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
    }

    static create(props: Omit<ProfileProps, 'createdAt' | 'updatedAt'>) {
        return new Profile({
            ...props,
            createdAt: new Date(),
            updatedAt: new Date()
        })
    }
}

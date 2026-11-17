import { UserProps } from '../entities/User'

export type UpdateUserDTO = Partial<Pick<UserProps,
    | 'password' | 'status' | 'adminRole' | 'emailVerifiedAt'
    | 'twoFactorSecret' | 'twoFactorEnabled'
>>

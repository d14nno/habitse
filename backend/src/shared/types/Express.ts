/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-namespace */
import { Response as ResponseExpress } from 'express'
import useragent from 'express-useragent'

import { ISingleError } from '@shared/utils/AppError'
import { UserType } from '@modules/users/index/enums/UserType'
import { AdminRole } from '@modules/users/index/enums/AdminRole'

export { NextFunction, Request } from 'express'

export type SuccessResultResponse<T = any> = T

export interface ErrorResponse {
    errors: ISingleError[]
}

export type Response<T = any> = ResponseExpress<ISingleError[] | ErrorResponse | SuccessResultResponse<T>>

declare global {
    namespace Express {
        namespace Auth {
            interface User {
                /** Id of user authenticated */
                id: number
                /** Email of user authenticated */
                email: string
                /** user | admin */
                type: UserType
                /** Papel do administrador (null para usuários comuns) */
                adminRole?: AdminRole | null
                /** sessionId of user authenticated */
                sessionId: number
            }
        }

        interface Request {
            useragent: useragent
            userIp: string
            /** When is authenticated */
            authenticatedUser: Express.Auth.User
        }
    }
}

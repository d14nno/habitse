import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { getPaginationParams, paginationQuerySchema } from '@shared/infra/validate/pagination'
import { Request, Response } from '@shared/types/Express'
import { UserType } from '@modules/users/index/enums/UserType'
import { ListUsersUseCase } from './ListUsersUseCase'

export class ListUsersController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { type, status, search } = request.query as Record<string, any>

        const users = await container.resolve(ListUsersUseCase).execute(
            { type, status, search },
            getPaginationParams(request.query)
        )

        return response.json(users)
    }

    static validate = validate({
        [Segments.QUERY]: Joi.object().keys({
            ...paginationQuerySchema,
            type: Joi.string().valid(...Object.values(UserType)),
            status: Joi.string().valid('pending', 'active', 'inactive'),
            search: Joi.string().trim().max(120).allow('')
        })
    })
}

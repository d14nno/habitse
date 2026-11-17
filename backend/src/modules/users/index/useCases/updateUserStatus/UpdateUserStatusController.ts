import { container } from 'tsyringe'

import { adminActor } from '@shared/infra/http/middleware/Auth'
import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { UpdateUserStatusUseCase } from './UpdateUserStatusUseCase'

export class UpdateUserStatusController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const user = await container.resolve(UpdateUserStatusUseCase).execute(
            Number(request.params.id),
            request.body.status,
            adminActor(request)
        )

        return response.json(user)
    }

    static validate = validate({
        [Segments.PARAMS]: Joi.object().keys({
            id: Joi.number().integer().positive().required()
        }),
        [Segments.BODY]: Joi.object().keys({
            status: Joi.string().valid('active', 'inactive').required()
        })
    })
}

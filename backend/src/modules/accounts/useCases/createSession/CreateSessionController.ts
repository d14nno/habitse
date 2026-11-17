import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { CreateSessionUseCase } from './CreateSessionUseCase'

export class CreateSessionController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { email, password } = request.body
        const { useragent, userIp } = request

        const result = await container.resolve(CreateSessionUseCase).execute(useragent, userIp, { email, password })

        return response.json(result)
    }

    static validate = validate({
        [Segments.BODY]: Joi.object().keys({
            email: Joi.string().trim().lowercase().email().required(),
            password: Joi.string().required()
        })
    })
}

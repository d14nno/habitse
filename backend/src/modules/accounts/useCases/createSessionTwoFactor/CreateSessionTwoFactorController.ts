import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { CreateSessionTwoFactorUseCase } from './CreateSessionTwoFactorUseCase'

export class CreateSessionTwoFactorController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { twoFactorToken, code } = request.body

        const result = await container.resolve(CreateSessionTwoFactorUseCase).execute(request.useragent, request.userIp, { twoFactorToken, code })

        return response.json(result)
    }

    static validate = validate({
        [Segments.BODY]: Joi.object().keys({
            twoFactorToken: Joi.string().uuid().required(),
            code: Joi.string().length(6).pattern(/^\d+$/).required()
        })
    })
}

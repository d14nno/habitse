import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { CreatePasswordResetTokenUseCase } from './CreatePasswordResetTokenUseCase'

export class CreatePasswordResetTokenController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { email } = request.body

        await container.resolve(CreatePasswordResetTokenUseCase).execute({ ip: request.userIp, email })

        return response.status(204).send()
    }

    static validate = validate({
        [Segments.BODY]: Joi.object().keys({
            email: Joi.string().trim().lowercase().email().required()
        })
    })
}

import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { ResetPasswordUseCase } from './ResetPasswordUseCase'

export class ResetPasswordController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { email, token, password } = request.body

        await container.resolve(ResetPasswordUseCase).execute({ email, token, password })

        return response.status(204).send()
    }

    static validate = validate({
        [Segments.BODY]: Joi.object().keys({
            email: Joi.string().trim().lowercase().email().required(),
            token: Joi.string().length(6).pattern(/^\d+$/).required(),
            password: Joi.string().min(8).required()
        })
    })
}

import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { VerificationChannel } from '@modules/accounts/enums/VerificationChannel'
import { ConfirmVerificationUseCase } from './ConfirmVerificationUseCase'

export class ConfirmVerificationController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const user = await container.resolve(ConfirmVerificationUseCase).execute(
            request.authenticatedUser.id,
            request.body.channel,
            request.body.code
        )

        return response.json(user)
    }

    static validate = validate({
        [Segments.BODY]: Joi.object().keys({
            channel: Joi.string().valid(...Object.values(VerificationChannel)).required(),
            code: Joi.string().length(6).pattern(/^\d+$/).required()
        })
    })
}

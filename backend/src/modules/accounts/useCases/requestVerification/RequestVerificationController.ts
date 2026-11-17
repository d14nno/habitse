import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { VerificationChannel } from '@modules/accounts/enums/VerificationChannel'
import { RequestVerificationUseCase } from './RequestVerificationUseCase'

export class RequestVerificationController {
    static async handle(request: Request, response: Response): Promise<Response> {
        await container.resolve(RequestVerificationUseCase).execute(request.authenticatedUser.id, request.body.channel)

        return response.status(204).send()
    }

    static validate = validate({
        [Segments.BODY]: Joi.object().keys({
            channel: Joi.string().valid(...Object.values(VerificationChannel)).required()
        })
    })
}

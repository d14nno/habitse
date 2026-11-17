import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { extractBearerToken } from '@shared/infra/http/middleware/Auth'
import { RefreshTokenUseCase } from './RefreshTokenUseCase'

export class RefreshTokenController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const refreshToken = extractBearerToken(request.headers.authorization)

        const result = await container.resolve(RefreshTokenUseCase).execute(refreshToken)

        return response.status(200).json(result)
    }

    static validate = validate({
        [Segments.HEADERS]: Joi.object().keys({
            authorization: Joi.string().regex(/^Bearer\s(.+)$/).required()
        }).unknown(true).required()
    })
}

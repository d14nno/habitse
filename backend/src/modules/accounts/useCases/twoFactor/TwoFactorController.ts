import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { DisableTwoFactorUseCase, EnableTwoFactorUseCase, SetupTwoFactorUseCase } from './TwoFactorUseCases'

/** Gerenciamento da verificação em duas etapas da própria conta */
export class TwoFactorController {
    static async setup(request: Request, response: Response): Promise<Response> {
        return response.json(await container.resolve(SetupTwoFactorUseCase).execute(request.authenticatedUser.id))
    }

    static async enable(request: Request, response: Response): Promise<Response> {
        await container.resolve(EnableTwoFactorUseCase).execute(request.authenticatedUser.id, request.body.code)
        return response.status(204).send()
    }

    static async disable(request: Request, response: Response): Promise<Response> {
        await container.resolve(DisableTwoFactorUseCase).execute(request.authenticatedUser.id, request.body.code)
        return response.status(204).send()
    }

    static validateCode = validate({
        [Segments.BODY]: Joi.object().keys({ code: Joi.string().length(6).pattern(/^\d+$/).required() })
    })
}

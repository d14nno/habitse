import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { UpdatePasswordUseCase } from './UpdatePasswordUseCase'

export class UpdatePasswordController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { passwordOld, password } = request.body

        await container.resolve(UpdatePasswordUseCase).execute(request.authenticatedUser.id, { passwordOld, password })

        return response.status(204).send()
    }

    static validate = validate({
        [Segments.BODY]: Joi.object().keys({
            passwordOld: Joi.string().required(),
            password: Joi.string().min(8).required(),
            passwordConfirm: Joi.string().valid(Joi.ref('password')).required()
                .messages({ 'any.only': 'passwordConfirm: as senhas não coincidem.' })
        })
    })
}

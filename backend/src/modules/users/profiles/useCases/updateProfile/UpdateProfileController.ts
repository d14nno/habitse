import { container } from 'tsyringe'
import { Joi, Segments, validate } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { UpdateProfileUseCase } from './UpdateProfileUseCase'

export class UpdateProfileController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { name, phoneNumber, document, birthDate } = request.body

        await container.resolve(UpdateProfileUseCase).execute(request.authenticatedUser.id, {
            name,
            phoneNumber: phoneNumber === null ? null : phoneNumber?.phoneNumberOnlyNumbers,
            document,
            birthDate
        })

        return response.status(204).send()
    }

    static validate = validate({
        [Segments.BODY]: Joi.object()
            .keys({
                name: Joi.string().trim().min(3).max(120),
                phoneNumber: Joi.phoneNumber().allow(null),
                document: Joi.document().allow(null),
                birthDate: Joi.date().iso().max('now').raw().allow(null)
            })
            .min(1)
            .required()
    })
}

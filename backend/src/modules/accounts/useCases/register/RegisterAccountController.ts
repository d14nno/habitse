import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { RegisterAccountUseCase } from './RegisterAccountUseCase'

export class RegisterAccountController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { email, password, name, phoneNumber, document } = request.body
        const { useragent, userIp } = request

        const result = await container.resolve(RegisterAccountUseCase).execute(useragent, userIp, {
            email,
            password,
            name,
            phoneNumber: phoneNumber.phoneNumberOnlyNumbers,
            document,
            birthDate: null
        })

        return response.status(201).json(result)
    }

    static validate = validate({
        [Segments.BODY]: Joi.object().keys({
            email: Joi.string().trim().lowercase().email().required(),
            password: Joi.string().min(8).required(),
            name: Joi.string().trim().min(3).max(120).required(),
            phoneNumber: Joi.phoneNumber().required(),
            // CPF ou CNPJ, somente dígitos após a validação
            document: Joi.document().required()
        })
    })
}

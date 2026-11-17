import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { GetAccountUseCase } from '@modules/accounts/useCases/getAccount/GetAccountUseCase'

/** GET /admin/users/:id — reaproveita o mesmo use case de GET /accounts/me */
export class GetUserController {
    static async handle(request: Request, response: Response): Promise<Response> {
        return response.json(await container.resolve(GetAccountUseCase).execute(Number(request.params.id)))
    }

    static validate = validate({
        [Segments.PARAMS]: Joi.object().keys({
            id: Joi.number().integer().positive().required()
        })
    })
}

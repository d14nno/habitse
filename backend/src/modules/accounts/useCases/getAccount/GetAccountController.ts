import { container } from 'tsyringe'

import { Request, Response } from '@shared/types/Express'
import { GetAccountUseCase } from './GetAccountUseCase'

export class GetAccountController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const account = await container.resolve(GetAccountUseCase).execute(request.authenticatedUser.id)

        return response.json(account)
    }
}

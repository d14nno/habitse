import { container } from 'tsyringe'

import { Request, Response } from '@shared/types/Express'
import { DeleteSessionUseCase } from './DeleteSessionUseCase'

export class DeleteSessionController {
    static async handle(request: Request, response: Response): Promise<Response> {
        await container.resolve(DeleteSessionUseCase).execute(request.authenticatedUser)

        return response.status(204).send()
    }
}

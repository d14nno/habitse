import { container } from 'tsyringe'

import { Request, Response } from '@shared/types/Express'
import { UploadAvatarUseCase } from './UploadAvatarUseCase'

export class UploadAvatarController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { buffer, mimetype, originalname } = request.file

        const result = await container.resolve(UploadAvatarUseCase).execute(
            request.authenticatedUser.id,
            { buffer, mimetype, originalName: originalname }
        )

        return response.json(result)
    }
}

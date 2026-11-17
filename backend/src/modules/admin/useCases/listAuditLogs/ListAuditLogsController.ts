import { container } from 'tsyringe'

import { validate, Joi, Segments } from '@shared/infra/validate'
import { getPaginationParams, paginationQuerySchema } from '@shared/infra/validate/pagination'
import { Request, Response } from '@shared/types/Express'
import { ListAuditLogsUseCase } from './ListAuditLogsUseCase'

export class ListAuditLogsController {
    static async handle(request: Request, response: Response): Promise<Response> {
        const { adminId, action, entityType, entityId } = request.query as Record<string, string>

        return response.json(await container.resolve(ListAuditLogsUseCase).execute(
            { adminId: adminId ? Number(adminId) : undefined, action, entityType, entityId },
            getPaginationParams(request.query)
        ))
    }

    static validate = validate({
        [Segments.QUERY]: Joi.object().keys({
            ...paginationQuerySchema,
            adminId: Joi.number().integer().positive(),
            action: Joi.string().trim().max(60).allow(''),
            entityType: Joi.string().trim().max(60).allow(''),
            entityId: Joi.string().trim().max(60).allow('')
        })
    })
}

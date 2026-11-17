import { container } from 'tsyringe'

import { adminActor } from '@shared/infra/http/middleware/Auth'
import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { AdminRole } from '@modules/users/index/enums/AdminRole'
import { ListAdminsUseCase, ManageAdminUseCase } from './AdminUseCases'

export class AdminController {
    static async list(_request: Request, response: Response): Promise<Response> {
        return response.json(await container.resolve(ListAdminsUseCase).execute())
    }

    static async create(request: Request, response: Response): Promise<Response> {
        const { email, name, password, adminRole } = request.body

        return response.status(201).json(await container.resolve(ManageAdminUseCase).create({ email, name, password, adminRole }, adminActor(request)))
    }

    static async update(request: Request, response: Response): Promise<Response> {
        const { adminRole, status } = request.body

        return response.json(await container.resolve(ManageAdminUseCase).update(Number(request.params.id), { adminRole, status }, adminActor(request)))
    }

    static validateCreate = validate({
        [Segments.BODY]: Joi.object().keys({
            email: Joi.string().trim().lowercase().email().required(),
            name: Joi.string().trim().min(3).max(120).required(),
            password: Joi.string().min(8).required(),
            adminRole: Joi.string().valid(...Object.values(AdminRole)).required()
        })
    })

    static validateUpdate = validate({
        [Segments.PARAMS]: Joi.object().keys({ id: Joi.number().integer().positive().required() }),
        [Segments.BODY]: Joi.object().keys({
            adminRole: Joi.string().valid(...Object.values(AdminRole)),
            status: Joi.string().valid('active', 'inactive')
        }).min(1)
    })
}

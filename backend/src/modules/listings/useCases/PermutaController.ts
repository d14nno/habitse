import { container } from 'tsyringe'

import { adminActor } from '@shared/infra/http/middleware/Auth'
import { validate, Joi, Segments } from '@shared/infra/validate'
import { Request, Response } from '@shared/types/Express'
import { LISTING_STATUSES, LISTING_TYPES } from '../enums/ListingCategory'
import { ListPermutasUseCase, PermutaCatalogUseCase, RemovePermutaUseCase, SavePermutaUseCase } from './PermutaUseCases'

const ID = Joi.string().trim().pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(80).required()

export class PermutaController {
    static async list(_request: Request, response: Response): Promise<Response> {
        return response.json(await container.resolve(ListPermutasUseCase).execute())
    }

    static async save(request: Request, response: Response): Promise<Response> {
        return response.json(await container.resolve(SavePermutaUseCase).execute(request.params.id, request.body, adminActor(request)))
    }

    static async remove(request: Request, response: Response): Promise<Response> {
        await container.resolve(RemovePermutaUseCase).execute(request.params.id, adminActor(request))
        return response.status(204).send()
    }

    /** Pública: as permutas que o site mostra */
    static async catalog(_request: Request, response: Response): Promise<Response> {
        return response.set('Cache-Control', 'public, max-age=60').json(await container.resolve(PermutaCatalogUseCase).execute())
    }

    static validateId = validate({ [Segments.PARAMS]: Joi.object().keys({ id: ID }) })

    static validateSave = validate({
        [Segments.PARAMS]: Joi.object().keys({ id: ID }),
        [Segments.BODY]: Joi.object().keys({
            tipo: Joi.string().valid(...LISTING_TYPES).required(),
            cidade: Joi.string().trim().max(80).required(),
            bairro: Joi.string().trim().max(80).required(),
            condominio: Joi.string().trim().max(120).allow(null, ''),
            quartos: Joi.number().integer().min(0).max(99).required(),
            suites: Joi.number().integer().min(0).max(99),
            vagas: Joi.number().integer().min(0).max(99),
            area: Joi.number().positive().required(),
            areaTerreno: Joi.number().positive(),
            destaques: Joi.array().items(Joi.string().trim().max(120)).max(12),
            valor: Joi.number().positive().required(),
            valorCondominio: Joi.number().min(0).allow(null),
            status: Joi.string().valid(...LISTING_STATUSES),
            fotos: Joi.array().items(Joi.string().trim().max(500)).max(20),
            place: Joi.object().keys({ lat: Joi.number().min(-90).max(90).required(), lng: Joi.number().min(-180).max(180).required(), approx: Joi.boolean().default(true) }).allow(null)
        })
    })
}

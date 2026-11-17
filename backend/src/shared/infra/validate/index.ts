import {
    celebrate,
    isCelebrateError,
    CelebrateError,
    Joi as JoiCelebrate,
    SchemaOptions
} from 'celebrate'
import { RequestHandler, Request, Response, NextFunction } from 'express'
import HTTP from 'http'
import { BaseValidationOptions } from 'joi'

import cpf from './cpf'
import document from './document'
import phoneNumber from './phoneNumber'

export { Segments } from 'celebrate'

export const Joi = {
    ...JoiCelebrate,
    cpf,
    document,
    phoneNumber
}

export type Options = {
    statusCode: number
}

const joiErrorMessagesMap: Record<string, string> = {
    // Gerais
    'any.required': 'este campo é obrigatório.',
    'any.only': 'o valor informado não é permitido.',
    'any.invalid': 'o valor informado é inválido.',
    'any.unknown': 'Campo não reconhecido.',
    'any.custom': 'erro de validação personalizado.',
    'any.default': 'erro padrão de validação.',
    'any.ref': 'referência inválida.',

    // String
    'string.base': 'este campo deve ser um texto.',
    'string.empty': 'este campo não pode estar vazio.',
    'string.min': 'o texto deve ter pelo menos {#limit} caracteres.',
    'string.max': 'o texto deve ter no máximo {#limit} caracteres.',
    'string.length': 'o texto deve ter exatamente {#limit} caracteres.',
    'string.alphanum': 'o texto deve conter apenas letras e números.',
    'string.token': 'o texto deve conter apenas caracteres alfanuméricos ou sublinhados.',
    'string.pattern.base': 'o valor informado não está no formato esperado.',
    'string.email': 'formato de e-mail inválido.',
    'string.uri': 'formato de URL inválido.',
    'string.uriCustomScheme': 'url com esquema inválido.',
    'string.uriRelativeOnly': 'a URL deve ser relativa.',
    'string.guid': 'o valor deve ser um GUID válido.',
    'string.hex': 'o texto deve conter apenas caracteres hexadecimais.',
    'string.lowercase': 'o texto deve estar em letras minúsculas.',
    'string.uppercase': 'o texto deve estar em letras maiúsculas.',
    'string.trim': 'o texto não deve conter espaços no início ou fim.',
    'string.hostname': 'o valor deve ser um nome de host válido.',
    'string.ip': 'o valor deve ser um endereço IP válido.',
    'string.ipVersion': 'Versão de IP inválida.',
    'string.isoDate': 'a data deve estar no formato ISO 8601.',
    'string.base64': 'o valor deve estar codificado em Base64.',
    'string.creditCard': 'o número do cartão de crédito é inválido.',
    'string.normalize': 'erro ao normalizar o valor do texto.',

    // Number
    'number.base': 'este campo deve ser um número.',
    'number.integer': 'o número deve ser inteiro.',
    'number.min': 'o número deve ser maior ou igual a {#limit}.',
    'number.max': 'o número deve ser menor ou igual a {#limit}.',
    'number.less': 'o número deve ser menor que {#limit}.',
    'number.greater': 'o número deve ser maior que {#limit}.',
    'number.positive': 'o número deve ser positivo.',
    'number.negative': 'o número deve ser negativo.',
    'number.precision': 'o número deve ter no máximo {#limit} casas decimais.',
    'number.multiple': 'o número deve ser múltiplo de {#multiple}.',
    'number.unsafe': 'o número não pode ser inseguro.',

    // Boolean
    'boolean.base': 'este campo deve ser verdadeiro ou falso.',

    // Date
    'date.base': 'este campo deve ser uma data válida.',
    'date.format': 'a data deve estar no formato {#format}.',
    'date.greater': 'a data deve ser posterior a {#limit}.',
    'date.less': 'a data deve ser anterior a {#limit}.',
    'date.min': 'a data deve ser no mínimo {#limit}.',
    'date.max': 'a data deve ser no máximo {#limit}.',
    'date.timestamp': 'a data deve ser um timestamp válido.',

    // Array
    'array.base': 'este campo deve ser uma lista.',
    'array.min': 'a lista deve ter no mínimo {#limit} itens.',
    'array.max': 'a lista deve ter no máximo {#limit} itens.',
    'array.length': 'a lista deve conter exatamente {#limit} itens.',
    'array.includes': 'o valor informado não é permitido na lista.',
    'array.includesRequiredUnknowns': 'a lista deve conter valores obrigatórios.',
    'array.includesRequiredKnowns': 'a lista está faltando itens obrigatórios.',
    'array.excludes': 'o valor informado não deve estar presente na lista.',
    'array.unique': 'a lista contém valores duplicados.',
    'array.hasKnown': 'a lista deve conter pelo menos um valor conhecido.',
    'array.hasUnknown': 'a lista deve conter pelo menos um valor válido.',

    // Object
    'object.base': 'este campo deve ser um objeto.',
    'object.unknown': 'este campo não é permitido.',
    'object.missing': 'pelo menos um dos seguintes campos deve estar presente: {#peers}.',
    'object.allowUnknown': 'este objeto não permite propriedades desconhecidas.',
    'object.and': 'os campos {#peers} devem estar todos presentes.',
    'object.nand': 'os campos {#peers} não podem estar juntos.',
    'object.xor': 'apenas um dos campos {#peers} deve estar presente.',
    'object.oxor': 'um ou nenhum dos campos {#peers} pode estar presente.',
    'object.with': 'o campo {#mainWithLabel} exige que {#peerWithLabel} também esteja presente.',
    'object.without':
        'o campo {#mainWithLabel} não pode estar presente junto com {#peerWithLabel}.',
    'object.rename.multiple': 'renomeação de múltiplos campos não é permitida.',
    'object.rename.override': 'renomeação sobrescreve um campo existente.',
    'object.length': 'o objeto deve conter exatamente {#limit} campos.',
    'object.min': 'o objeto deve conter pelo menos {#limit} campos.',
    'object.max': 'o objeto deve conter no máximo {#limit} campos.',
    'object.pattern.match': 'o campo não corresponde ao padrão esperado.',

    // Function
    'function.base': 'este campo deve ser uma função.',
    'function.arity': 'a função deve ter aridade {#n}.',
    'function.minArity': 'a função deve ter no mínimo {#n} argumentos.',
    'function.maxArity': 'a função deve ter no máximo {#n} argumentos.',

    // Symbol
    'symbol.base': 'o valor deve ser um símbolo válido.',

    // Binary
    'binary.base': 'este campo deve conter dados binários.',
    'binary.min': 'o conteúdo deve ter pelo menos {#limit} bytes.',
    'binary.max': 'o conteúdo deve ter no máximo {#limit} bytes.',
    'binary.length': 'o conteúdo deve ter exatamente {#limit} bytes.'
}

const internals = {
    DEFAULT_ERROR_ARGS: {
        celebrated: true
    },
    DEFAULT_ERRORS_OPTS: {
        statusCode: 400
    },
    DEFAULT_CELEBRATE_OPTS: {
        mode: 'partial'
    }
}

const validStatusCodes = Object.keys(HTTP.STATUS_CODES).reduce<number[]>((memo, status) => {
    const statusCode = Number(status)
    if (statusCode > 399 && statusCode < 599) {
        memo.push(statusCode)
    }
    return memo
}, [])

export const ERRORS_OPTS_SCHEMA = Joi.object({
    statusCode: Joi.number()
        .integer()
        .valid(...validStatusCodes)
})

type ErrorValidate = {
    message: string
    details: {
        message: string
        path: string[]
        type: string
        context: {
            label: string
            value: string
            key: string
        }
    }[]
}

export const validateErrorsMiddleware = (opts?: Options): any => {
    const finalOpts = { ...internals.DEFAULT_ERRORS_OPTS, ...opts }
    Joi.assert(finalOpts, ERRORS_OPTS_SCHEMA)

    return (
        error: CelebrateError,
        _: Request,
        response: Response,
        next: NextFunction
    ): void | Response<any, Record<string, any>> => {
        if (!isCelebrateError(error)) {
            return next(error)
        }

        const { statusCode } = finalOpts

        const [source, errorItems] = error.details.entries().next().value as [string, ErrorValidate]

        const result = {
            errors: errorItems.details.map(errorItem => {
                const label = errorItem.context?.label || errorItem.path?.join('.') || 'campo'
                const translatedMessage = joiErrorMessagesMap[errorItem.type]
                    ? `${label}: ${joiErrorMessagesMap[errorItem.type]}`
                    : errorItem.message

                return {
                    message: translatedMessage,
                    code: `validateRequest.${source}`,
                    details: {
                        path: errorItem.path,
                        type: errorItem.type,
                        context: errorItem.context
                    }
                }
            })
        }

        return response.status(statusCode).send(result)
    }
}

function validate<P = any, ResBody = any, ReqBody = any, ReqQuery = any>(
    schema: SchemaOptions,
    joiOpts?: BaseValidationOptions
): RequestHandler<P, ResBody, ReqBody, ReqQuery> {
    return celebrate(schema, {
        ...joiOpts,
        abortEarly: false
    })
}

export { validate }

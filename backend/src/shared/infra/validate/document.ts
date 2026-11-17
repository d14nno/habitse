import Joi from 'joi'
import { isValidDocument, onlyDigits } from '@shared/utils/Cpf'

/** CPF ou CNPJ válido; o valor é normalizado para somente dígitos */
export default (): Joi.Schema<string> => {
    return Joi.string().custom((value, helper) => {
        if (!isValidDocument(value)) return helper.message({ custom: 'CPF ou CNPJ inválido.' })

        return onlyDigits(value)
    })
}

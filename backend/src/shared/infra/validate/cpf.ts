import Joi from 'joi'
import { isValidCpf, onlyDigits } from '@shared/utils/Cpf'

/** CPF válido; o valor é normalizado para somente dígitos */
export default (): Joi.Schema<string> => {
    return Joi.string().custom((value, helper) => {
        if (!isValidCpf(value)) return helper.message({ custom: 'CPF inválido.' })

        return onlyDigits(value)
    })
}

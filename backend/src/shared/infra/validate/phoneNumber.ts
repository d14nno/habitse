import Joi from 'joi'

export default (): Joi.Schema<any> => {
    return Joi.custom((value, helper) => {
        let maskedPhoneNumber
        let isPhoneValid
        let phoneNumber = value.replace(/\D/g, '')
        if (phoneNumber.length === 10 || phoneNumber.length === 11) {
            phoneNumber = `55${phoneNumber}`
            isPhoneValid = true
        } else if (phoneNumber.length < 10 || phoneNumber.length > 13) {
            isPhoneValid = false
        }
        const phoneNumberOnlyNumbers = phoneNumber.substring(2)
        if (phoneNumber.length === 12)
            maskedPhoneNumber = phoneNumber
                .replace(/\D/g, '')
                .replace(/(\d{2})(\d)/, '+$1 $2')
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1 $2')
                .replace(/(\d{4})\d+?$/, '$1')
        if (phoneNumber.length === 13)
            maskedPhoneNumber = phoneNumber
                .replace(/\D/g, '')
                .replace(/(\d{2})(\d)/, '+$1 $2')
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{1})(\d{4})/, '$1 $2')
                .replace(/(\d{4})(\d)/, '$1 $2')

        if (!isPhoneValid) {
            return helper.error('any.phoneNumber')
        }

        return {
            phoneNumber,
            maskedPhoneNumber,
            phoneNumberOnlyNumbers
        }
    })
}

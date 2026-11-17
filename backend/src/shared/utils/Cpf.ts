/** Valida CPF (somente dígitos ou com máscara). */
export function isValidCpf(value: string): boolean {
    const cpf = String(value ?? '').replace(/\D/g, '')

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

    const digit = (length: number) => {
        const sum = cpf
            .slice(0, length)
            .split('')
            .reduce((total, char, index) => total + Number(char) * (length + 1 - index), 0)

        const rest = (sum * 10) % 11

        return rest === 10 ? 0 : rest
    }

    return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

/** Valida CNPJ (somente dígitos ou com máscara). */
export function isValidCnpj(value: string): boolean {
    const cnpj = String(value ?? '').replace(/\D/g, '')

    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false

    const digit = (length: number) => {
        const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        const rest = weights.reduce((total, weight, index) => total + Number(cnpj[index]) * weight, 0) % 11

        return rest < 2 ? 0 : 11 - rest
    }

    return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13])
}

/** CPF (11 dígitos) ou CNPJ (14 dígitos) válido */
export function isValidDocument(value: string): boolean {
    return isValidCpf(value) || isValidCnpj(value)
}

export const onlyDigits = (value?: string | null) => (value ?? '').replace(/\D/g, '')

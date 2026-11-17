
export interface RegisterAccountDTO {
    email: string
    password: string
    name: string
    phoneNumber?: string | null
    /** CPF (somente dígitos) */
    document?: string | null
    /** YYYY-MM-DD */
    birthDate?: string | null
    /** Nome da imobiliária criada no cadastro (padrão: "Imobiliária de <nome>") */
}

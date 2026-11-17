export enum UserType {
    /** Usuário comum do produto (cadastro público em POST /accounts) */
    USER = 'user',
    /** Acesso ao painel (/admin). Não se cadastra pela API pública. */
    ADMIN = 'admin'
}

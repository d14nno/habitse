import { SITE } from '@/config'

/** Acesso ao painel: login com e-mail e senha na API; o token fica só neste navegador */
const KEY = 'habitse.admin'

interface Session { token: string, refreshToken: string, email: string }

export class AdminError extends Error {
    constructor(public status: number, message: string) {
        super(message)
    }
}

export interface Place { lat: number, lng: number, approx: boolean }

export interface AdminPermuta {
    id: string
    tipo: string
    cidade: string
    bairro: string
    condominio: string | null
    quartos: number
    suites?: number
    vagas?: number
    area: number
    areaTerreno?: number
    destaques?: string[]
    valor: number
    valorCondominio: number | null
    status?: 'published' | 'draft' | 'sold'
    fotos?: string[]
    place: Place | null
}

const read = (): Session | null => {
    try {
        return JSON.parse(localStorage.getItem(KEY) ?? 'null')
    } catch {
        return null
    }
}
const write = (session: Session | null) => {
    try {
        if (session) localStorage.setItem(KEY, JSON.stringify(session))
        else localStorage.removeItem(KEY)
    } catch {
        // Navegador sem armazenamento: o login vale só até recarregar
    }
}

export const adminEmail = () => read()?.email ?? null
export const isLoggedIn = () => read() !== null

async function call<T>(path: string, init: RequestInit & { auth?: string } = {}): Promise<T> {
    const { auth, ...options } = init
    let response: Response
    try {
        response = await fetch(`${SITE.api}${path}`, {
            ...options,
            headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Authorization: `Bearer ${auth}` } : {}) }
        })
    } catch {
        throw new AdminError(0, 'Sem conexão com o servidor. Tente de novo.')
    }
    if (response.status === 204) return undefined as T

    const body = await response.json().catch(() => null)
    if (!response.ok) throw new AdminError(response.status, body?.errors?.map((error: { message: string }) => error.message).join(' ') || 'Não foi possível concluir.')

    return body as T
}

export async function login(email: string, password: string): Promise<void> {
    const result = await call<{ token?: string, refreshToken?: string, user?: { type: string } }>('/sessions', { method: 'POST', body: JSON.stringify({ email, password }) })
    if (!result.token || !result.refreshToken) throw new AdminError(400, 'Esta conta exige verificação em duas etapas, que o painel ainda não suporta.')
    if (result.user?.type !== 'admin') {
        await call('/sessions', { method: 'DELETE', auth: result.token }).catch(() => undefined)
        throw new AdminError(403, 'Esta conta não é de administrador.')
    }
    write({ token: result.token, refreshToken: result.refreshToken, email })
}

export async function logout(): Promise<void> {
    const session = read()
    write(null)
    if (session) await call('/sessions', { method: 'DELETE', auth: session.token }).catch(() => undefined)
}

/** Chamada autenticada; se o token venceu, renova uma vez com o refresh token */
async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
    const session = read()
    if (!session) throw new AdminError(401, 'Entre para continuar.')

    try {
        return await call<T>(path, { ...init, auth: session.token })
    } catch (error) {
        if (!(error instanceof AdminError) || error.status !== 401) throw error

        try {
            const renewed = await call<{ token: string, refreshToken?: string }>('/sessions/refresh-token', { method: 'POST', auth: session.refreshToken })
            write({ ...session, token: renewed.token, refreshToken: renewed.refreshToken ?? session.refreshToken })
            return await call<T>(path, { ...init, auth: renewed.token })
        } catch {
            write(null)
            throw new AdminError(401, 'Sua sessão terminou. Entre de novo.')
        }
    }
}

export const changePassword = (passwordOld: string, password: string) =>
    authed<void>('/accounts/password', { method: 'PATCH', body: JSON.stringify({ passwordOld, password, passwordConfirm: password }) })

export const permutasAdmin = {
    list: () => authed<AdminPermuta[]>('/admin/permutas'),
    save: ({ id, ...fields }: AdminPermuta) => authed<AdminPermuta>(`/admin/permutas/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(fields) }),
    remove: (id: string) => authed<void>(`/admin/permutas/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

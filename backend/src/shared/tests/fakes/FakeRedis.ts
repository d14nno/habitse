/**
 * Substituto em memória de `@shared/infra/redis` para testes unitários (sem Redis rodando).
 * Uso no topo do spec: jest.mock('@shared/infra/redis', () => require('@shared/tests/fakes/FakeRedis'))
 */
const store = new Map<string, { value: string, expiresAt: number | null }>()

const read = (key: string) => {
    const entry = store.get(key)

    if (entry?.expiresAt && entry.expiresAt <= Date.now()) {
        store.delete(key)
        return undefined
    }

    return entry
}

export const RedisCache = {
    async set(key: string, value: unknown, ttl?: number): Promise<void> {
        store.set(key, { value: JSON.stringify(value), expiresAt: ttl ? Date.now() + ttl * 1000 : null })
    },

    async get<T>(key: string): Promise<T | null> {
        const entry = read(key)
        return entry ? JSON.parse(entry.value) as T : null
    },

    async delete(key: string): Promise<void> {
        store.delete(key)
    },

    async exists(key: string): Promise<boolean> {
        return !!read(key)
    },

    async ttl(key: string): Promise<number> {
        const entry = read(key)
        if (!entry) return -2
        return entry.expiresAt ? Math.ceil((entry.expiresAt - Date.now()) / 1000) : -1
    },

    async quit(): Promise<void> {
        store.clear()
    }
}

export const getRedisClient = () => ({ ping: async () => 'PONG', disconnect: () => undefined })

export const cacheKey = (...parts: (string | number)[]) => ['test', ...parts].join(':')

/** Limpa o Redis falso entre testes */
export const clearFakeRedis = () => store.clear()

import Redis from 'ioredis'

export class RedisCache {
    private redis: Redis

    constructor(redisConfig?: any) {
        this.redis = redisConfig
    }

    /**
     * Adiciona ou atualiza uma variável temporária no Redis.
     * @param key - A chave da variável temporária.
     * @param value - O valor da variável temporária (pode ser um objeto JSON).
     * @param ttl - Tempo de vida em segundos (opcional).
     */
    public async set(key: string, value: any, ttl?: number): Promise<void> {
        const stringValue = JSON.stringify(value)
        if (ttl) {
            await this.redis.set(key, stringValue, 'EX', ttl)
        } else {
            await this.redis.set(key, stringValue)
        }
    }

    /**
     * Recupera o valor de uma variável temporária do Redis.
     * @param key - A chave da variável temporária.
     * @returns O valor da variável temporária como um objeto JSON ou null se não existir.
     */
    public async get<T>(key: string): Promise<T | null> {
        const result = await this.redis.get(key)
        if (result) {
            try {
                return JSON.parse(result) as T
            } catch (error) {
                console.error('Erro ao parsear JSON:', error)
                return null
            }
        }
        return null
    }

    /**
     * Remove uma variável temporária do Redis.
     * @param key - A chave da variável temporária.
     */
    public async delete(key: string): Promise<void> {
        await this.redis.del(key)
    }

    /**
     * Verifica se uma variável temporária existe no Redis.
     * @param key - A chave da variável temporária.
     * @returns true se a variável existir, false caso contrário.
     */
    public async exists(key: string): Promise<boolean> {
        const result = await this.redis.exists(key)
        return result === 1
    }

    /**
     * Obtém o tempo de vida restante de uma variável temporária no Redis.
     * @param key - A chave da variável temporária.
     * @returns O tempo de vida restante em segundos ou -1 se a chave não existir.
     */
    public async ttl(key: string): Promise<number> {
        return this.redis.ttl(key)
    }

    /**
     * Fecha a conexão com o Redis.
     */
    public async quit(): Promise<void> {
        await this.redis.quit()
    }
}

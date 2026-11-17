import Redis from 'ioredis'
import { config } from '@shared/config'
import { RedisCache as RedisCacheClient } from '@shared/infra/redis/redis_cache'
import Sentry from '../sentry'

// Criando uma instância única do Redis (Singleton)
let RedisClient: Redis | null = null

function getRedisClient(): Redis {
    if (!RedisClient) {
        RedisClient = new Redis(config.get('redis.cacheUri'), {
            maxRetriesPerRequest: null
            // Outras configurações do Redis, como pool de conexões e timeout
        })

        RedisClient.on('connect', () => {
            console.log('Conectado ao Redis')
        })

        RedisClient.on('error', error => {
            Sentry.captureException(error)
            console.error('Erro ao conectar ao Redis', error)
        })
    }

    return RedisClient
}

const RedisCache = new RedisCacheClient(getRedisClient())

/** Monta uma chave com o prefixo do projeto (REDIS_KEY_PREFIX), ex.: cacheKey('session', 1) → 'app:session:1' */
const cacheKey = (...parts: (string | number)[]) => [config.get('redis.keyPrefix'), ...parts].join(':')

export { RedisCache, getRedisClient, cacheKey }

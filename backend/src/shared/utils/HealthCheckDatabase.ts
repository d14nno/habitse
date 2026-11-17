/**
 * Utility para Health Check de Banco de Dados e Redis
 * Reutilizável em todas as APIs do workspace
 */

interface HealthCheckResult {
    status: 'ok' | 'degraded' | 'error';
    timestamp: string;
    database?: {
        status: 'connected' | 'disconnected';
        latency: number;
        error?: string;
    };
    redis?: {
        status: 'connected' | 'disconnected';
        latency: number;
        error?: string;
    };
    message: string;
}

/**
 * Verifica a conexão com o banco de dados via Knex
 */
export async function checkDatabaseHealth(knex: any): Promise<{
    status: 'connected' | 'disconnected';
    latency: number;
    error?: string;
}> {
    const startTime = Date.now()

    try {
        if (!knex) {
            return {
                status: 'disconnected',
                latency: 0,
                error: 'Knex instance not initialized',
            }
        }

        // Testa a conexão executando uma query simples
        await knex.raw('SELECT 1')

        const latency = Date.now() - startTime

        return {
            status: 'connected',
            latency,
        }
    } catch (error: any) {
        const latency = Date.now() - startTime

        return {
            status: 'disconnected',
            latency,
            error: error?.message || 'Unknown database error',
        }
    }
}

/**
 * Verifica a conexão com o Redis
 */
export async function checkRedisHealth(redis: any): Promise<{
    status: 'connected' | 'disconnected';
    latency: number;
    error?: string;
}> {
    const startTime = Date.now()

    try {
        if (!redis) {
            return {
                status: 'disconnected',
                latency: 0,
                error: 'Redis client not initialized',
            }
        }

        // Testa a conexão com PING
        await redis.ping()

        const latency = Date.now() - startTime

        return {
            status: 'connected',
            latency,
        }
    } catch (error: any) {
        const latency = Date.now() - startTime

        return {
            status: 'disconnected',
            latency,
            error: error?.message || 'Unknown Redis error',
        }
    }
}

/**
 * Executa health check completo (Database + Redis)
 * @param knex - Instância do Knex
 * @param redis - Instância do Redis (opcional)
 * @returns Resultado do health check
 */
export async function performFullHealthCheck(knex: any, redis?: any): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString()

    // Verifica Database
    const dbHealth = await checkDatabaseHealth(knex)

    // Verifica Redis (se fornecido)
    let redisHealth
    if (redis) {
        redisHealth = await checkRedisHealth(redis)
    }

    // Determina o status geral
    let overallStatus: 'ok' | 'degraded' | 'error' = 'ok'
    let message = 'Todos os serviços estão operacionais'

    // Se BD está down, é erro crítico
    if (dbHealth.status === 'disconnected') {
        overallStatus = 'error'
        message = `❌ Base de dados indisponível: ${dbHealth.error}`
    }
    // Se Redis está down mas foi configurado, é degraded
    else if (redisHealth && redisHealth.status === 'disconnected') {
        overallStatus = 'degraded'
        message = `⚠️ Redis indisponível: ${redisHealth.error}`
    }
    // Se latência está alta
    else if (dbHealth.latency > 5000 || (redisHealth && redisHealth.latency > 3000)) {
        overallStatus = 'degraded'
        message = '⚠️ Latência elevada detectada'
    }

    return {
        status: overallStatus,
        timestamp,
        database: dbHealth,
        redis: redisHealth,
        message,
    }
}

/**
 * Middleware Express para adicionar health check endpoint
 * @param knex - Instância do Knex
 * @param redis - Instância do Redis (opcional)
 * @returns Express middleware
 */
export function createHealthCheckRoute(knex: any, redis?: any) {
    return async (req: any, res: any) => {
        const health = await performFullHealthCheck(knex, redis)

        const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500

        res.status(statusCode).json(health)
    }
}

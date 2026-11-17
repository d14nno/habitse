import rateLimit from 'express-rate-limit'

/** Limite de requisições por IP na janela (padrão 15 min) */
export const limiter = (max: number, windowMs = 15 * 60 * 1000) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    message: { errors: [{ message: 'Muitas tentativas, tente novamente mais tarde', uniqueCode: 'RATE_LIMIT' }] }
})

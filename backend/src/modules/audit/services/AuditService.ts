import { inject, injectable } from 'tsyringe'

import { logger } from '@shared/infra/logger'
import { AuditLogInput, AuditLogRepository } from '../repositories/AuditLogRepository'

/** Quem executou uma ação administrativa */
export interface AdminActor {
    id: number
    ip?: string | null
}

/**
 * Registra ações de administradores. Falha ao auditar nunca deve
 * impedir a ação principal — apenas é logada.
 */
@injectable()
export class AuditService {
    constructor(
        @inject('AuditLogRepository')
        private auditLogRepository: AuditLogRepository
    ) { }

    async log(actor: AdminActor, entry: Omit<AuditLogInput, 'adminId' | 'ip'>): Promise<void> {
        try {
            await this.auditLogRepository.create({ ...entry, adminId: actor.id, ip: actor.ip ?? null })
        } catch (error) {
            logger.error({ err: error, entry }, 'Failed to write audit log')
        }
    }
}

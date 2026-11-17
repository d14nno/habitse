import { inject, injectable } from 'tsyringe'

import { PaginationParams } from '@shared/types/Pagination'
import { AuditLogRepository, FindAuditLogsOptions } from '@modules/audit/repositories/AuditLogRepository'

@injectable()
export class ListAuditLogsUseCase {
    constructor(@inject('AuditLogRepository') private auditLogRepository: AuditLogRepository) { }

    async execute(where: FindAuditLogsOptions['where'], pagination: PaginationParams) {
        return this.auditLogRepository.findMany({ where, pagination })
    }
}

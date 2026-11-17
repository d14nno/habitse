import { container } from 'tsyringe'
import { KnexAuditLogRepository } from '@modules/audit/infra/KnexAuditLogRepository'
import { AuditLogRepository } from '@modules/audit/repositories/AuditLogRepository'

container.registerSingleton<AuditLogRepository>('AuditLogRepository', KnexAuditLogRepository)

import { Paginated } from '@shared/types/Pagination'
import { AuditLog, AuditLogInput, AuditLogRepository, FindAuditLogsOptions } from '../repositories/AuditLogRepository'

export class InMemoryAuditLogRepository implements AuditLogRepository {
    public logs: AuditLogInput[] = []

    async create(input: AuditLogInput): Promise<void> {
        this.logs.push(input)
    }

    async findMany({ pagination }: FindAuditLogsOptions): Promise<Paginated<AuditLog>> {
        const data = [...this.logs].reverse().map((log, index) => ({
            id: index + 1,
            admin: log.adminId ? { id: log.adminId, name: null, email: '' } : null,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId === undefined || log.entityId === null ? null : String(log.entityId),
            data: log.data ?? {},
            ip: log.ip ?? null,
            createdAt: new Date()
        }))

        return { data, pagination: { ...pagination, total: data.length, lastPage: 1 } }
    }
}

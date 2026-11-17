import { Paginated, PaginationParams } from '@shared/types/Pagination'

export interface AuditLogInput {
    adminId: number | null
    action: string
    entityType: string
    entityId?: string | number | null
    data?: Record<string, unknown>
    ip?: string | null
}

export interface AuditLog {
    id: number
    admin: { id: number, name: string | null, email: string } | null
    action: string
    entityType: string
    entityId: string | null
    data: Record<string, unknown>
    ip: string | null
    createdAt: Date
}

export interface FindAuditLogsOptions {
    where?: { adminId?: number, action?: string, entityType?: string, entityId?: string }
    pagination: PaginationParams
}

export interface AuditLogRepository {
    create(input: AuditLogInput): Promise<void>
    findMany(options: FindAuditLogsOptions): Promise<Paginated<AuditLog>>
}

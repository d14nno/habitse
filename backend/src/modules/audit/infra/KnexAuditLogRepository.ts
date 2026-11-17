import { connection } from '@shared/infra/knex'
import { paginate } from '@shared/infra/knex/paginate'
import { Paginated } from '@shared/types/Pagination'
import { AuditLog, AuditLogInput, AuditLogRepository, FindAuditLogsOptions } from '../repositories/AuditLogRepository'

const LOGS = 'audit.audit_logs'

export class KnexAuditLogRepository implements AuditLogRepository {
    async create({ adminId, action, entityType, entityId, data = {}, ip }: AuditLogInput): Promise<void> {
        await connection(LOGS).insert({
            adminId,
            action,
            entityType,
            entityId: entityId === undefined || entityId === null ? null : String(entityId),
            data: JSON.stringify(data),
            ip: ip ?? null
        })
    }

    async findMany({ where = {}, pagination }: FindAuditLogsOptions): Promise<Paginated<AuditLog>> {
        const query = connection(LOGS)
            .leftJoin('users.users as u', 'u.id', `${LOGS}.adminId`)
            .leftJoin('users.profiles as p', 'p.userId', `${LOGS}.adminId`)
            .select(`${LOGS}.*`, 'u.email as adminEmail', 'p.name as adminName')
            .orderBy(`${LOGS}.createdAt`, 'desc')

        for (const [column, value] of Object.entries(where)) {
            if (value !== undefined && value !== '') query.where(`${LOGS}.${column}`, value)
        }

        const result = await paginate<any>(query, pagination)

        return {
            data: result.data.map(row => ({
                id: row.id,
                admin: row.adminId ? { id: row.adminId, name: row.adminName, email: row.adminEmail } : null,
                action: row.action,
                entityType: row.entityType,
                entityId: row.entityId,
                data: row.data,
                ip: row.ip,
                createdAt: row.createdAt
            })),
            pagination: result.pagination
        }
    }
}

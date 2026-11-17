export enum AdminRole {
    SUPER_ADMIN = 'super_admin',
    SUPPORT = 'support'
}

export enum Permission {
    USERS_READ = 'users:read',
    USERS_MANAGE = 'users:manage',
    ADMINS_MANAGE = 'admins:manage',
    AUDIT_READ = 'audit:read'
}

/** Permissões de cada papel. Para um novo papel/permissão, edite apenas aqui (e docs/API.md). */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
    [AdminRole.SUPER_ADMIN]: Object.values(Permission),
    [AdminRole.SUPPORT]: [Permission.USERS_READ, Permission.USERS_MANAGE]
}

export function permissionsOf(role?: AdminRole | null): Permission[] {
    return role ? ROLE_PERMISSIONS[role] ?? [] : []
}

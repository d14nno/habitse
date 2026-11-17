import { Router } from 'express'

import { ensurePermission, ensureUserType, headerAuth } from '@shared/infra/http/middleware/Auth'
import { UserType } from '@modules/users/index/enums/UserType'
import { Permission } from '@modules/users/index/enums/AdminRole'
import { AdminController } from '@modules/admin/useCases/admins/AdminController'
import { ListAuditLogsController } from '@modules/admin/useCases/listAuditLogs/ListAuditLogsController'
import { ListUsersController } from '@modules/users/index/useCases/listUsers/ListUsersController'
import { GetUserController } from '@modules/users/index/useCases/getUser/GetUserController'
import { UpdateUserStatusController } from '@modules/users/index/useCases/updateUserStatus/UpdateUserStatusController'

/** Rotas do painel administrativo. Cada rota exige a permissão do papel do administrador (docs/API.md). */
const AdminRoutes = Router()
const can = ensurePermission

AdminRoutes.use(headerAuth(), ensureUserType(UserType.ADMIN))

AdminRoutes.get('/users', can(Permission.USERS_READ), ListUsersController.validate, ListUsersController.handle)
AdminRoutes.get('/users/:id', can(Permission.USERS_READ), GetUserController.validate, GetUserController.handle)
AdminRoutes.patch('/users/:id/status', can(Permission.USERS_MANAGE), UpdateUserStatusController.validate, UpdateUserStatusController.handle)

AdminRoutes.get('/admins', can(Permission.ADMINS_MANAGE), AdminController.list)
AdminRoutes.post('/admins', can(Permission.ADMINS_MANAGE), AdminController.validateCreate, AdminController.create)
AdminRoutes.patch('/admins/:id', can(Permission.ADMINS_MANAGE), AdminController.validateUpdate, AdminController.update)


AdminRoutes.get('/audit-logs', can(Permission.AUDIT_READ), ListAuditLogsController.validate, ListAuditLogsController.handle)

export { AdminRoutes }

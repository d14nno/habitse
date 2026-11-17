import { InMemoryEmailService } from '@services/email/implementations/InMemoryEmailService'
import { GeoLocationService } from '@services/geoLocation/GeoLocationService'
import { InMemoryStorageService } from '@services/storage/implementations/InMemoryStorageService'
import { InMemoryPasswordResetTokenRepository } from '@modules/accounts/infra/inMemory/InMemoryPasswordResetTokenRepository'
import { InMemorySessionRepository } from '@modules/accounts/infra/inMemory/InMemorySessionRepository'
import { InMemoryVerificationCodeRepository } from '@modules/accounts/infra/inMemory/InMemoryVerificationCodeRepository'
import { LoginService } from '@modules/accounts/services/LoginService'
import { SessionTokenService } from '@modules/accounts/services/SessionTokenService'
import { ConfirmVerificationUseCase } from '@modules/accounts/useCases/confirmVerification/ConfirmVerificationUseCase'
import { CreateAdminUseCase } from '@modules/accounts/useCases/createAdmin/CreateAdminUseCase'
import { CreatePasswordResetTokenUseCase } from '@modules/accounts/useCases/createPasswordResetToken/CreatePasswordResetTokenUseCase'
import { CreateSessionUseCase } from '@modules/accounts/useCases/createSession/CreateSessionUseCase'
import { CreateSessionTwoFactorUseCase } from '@modules/accounts/useCases/createSessionTwoFactor/CreateSessionTwoFactorUseCase'
import { DeleteSessionUseCase } from '@modules/accounts/useCases/deleteSession/DeleteSessionUseCase'
import { GetAccountUseCase } from '@modules/accounts/useCases/getAccount/GetAccountUseCase'
import { RefreshTokenUseCase } from '@modules/accounts/useCases/refreshToken/RefreshTokenUseCase'
import { RegisterAccountUseCase } from '@modules/accounts/useCases/register/RegisterAccountUseCase'
import { RequestVerificationUseCase } from '@modules/accounts/useCases/requestVerification/RequestVerificationUseCase'
import { ResetPasswordUseCase } from '@modules/accounts/useCases/resetPassword/ResetPasswordUseCase'
import { DisableTwoFactorUseCase, EnableTwoFactorUseCase, SetupTwoFactorUseCase } from '@modules/accounts/useCases/twoFactor/TwoFactorUseCases'
import { UpdatePasswordUseCase } from '@modules/accounts/useCases/updatePassword/UpdatePasswordUseCase'
import { UploadAvatarUseCase } from '@modules/accounts/useCases/uploadAvatar/UploadAvatarUseCase'
import { InMemoryAuditLogRepository } from '@modules/audit/infra/InMemoryAuditLogRepository'
import { AuditService } from '@modules/audit/services/AuditService'
import { InMemoryUserRepository } from '@modules/users/index/infra/InMemoryUserRepository'
import { ListUsersUseCase } from '@modules/users/index/useCases/listUsers/ListUsersUseCase'
import { UpdateUserStatusUseCase } from '@modules/users/index/useCases/updateUserStatus/UpdateUserStatusUseCase'
import { ListAdminsUseCase, ManageAdminUseCase } from '@modules/admin/useCases/admins/AdminUseCases'
import { ListAuditLogsUseCase } from '@modules/admin/useCases/listAuditLogs/ListAuditLogsUseCase'
import { InMemoryProfileRepository } from '@modules/users/profiles/infra/InMemoryProfileRepository'
import { UpdateProfileUseCase } from '@modules/users/profiles/useCases/updateProfile/UpdateProfileUseCase'
import { InMemoryUnitOfWork } from '@shared/tests/fakes/InMemoryUnitOfWork'

const fakeGeo: GeoLocationService = {
    getGeoData: async () => ({ city: null, region: null, country: null, latitude: null, longitude: null })
}

export const USER_AGENT = { browser: 'jest' }
export const IP = '127.0.0.1'

/**
 * Monta repositórios em memória, serviços falsos e os use cases de contas já ligados entre si.
 * Specs que usam sessão/2FA precisam do Redis falso:
 * jest.mock('@shared/infra/redis', () => require('@shared/tests/fakes/FakeRedis'))
 */
export function createAccountsTestContext() {
    const profiles = new InMemoryProfileRepository()
    const users = new InMemoryUserRepository(profiles)
    const sessions = new InMemorySessionRepository()
    const passwordResetTokens = new InMemoryPasswordResetTokenRepository()
    const verificationCodes = new InMemoryVerificationCodeRepository()
    const auditLogs = new InMemoryAuditLogRepository()

    const email = new InMemoryEmailService()
    const storage = new InMemoryStorageService()

    const sessionTokenService = new SessionTokenService(sessions, fakeGeo)
    const loginService = new LoginService(users, sessionTokenService)
    const auditService = new AuditService(auditLogs)

    const unitOfWork = new InMemoryUnitOfWork()

    return {
        repositories: { users, profiles, sessions, passwordResetTokens, verificationCodes, auditLogs },
        services: { email, storage, sessionTokenService },
        register: new RegisterAccountUseCase(users, profiles, sessionTokenService, unitOfWork),
        createAdmin: new CreateAdminUseCase(users, profiles),
        createSession: new CreateSessionUseCase(users, loginService),
        createSessionTwoFactor: new CreateSessionTwoFactorUseCase(users, loginService),
        refreshToken: new RefreshTokenUseCase(sessions, users, sessionTokenService),
        deleteSession: new DeleteSessionUseCase(sessionTokenService),
        getAccount: new GetAccountUseCase(users),
        setupTwoFactor: new SetupTwoFactorUseCase(users),
        enableTwoFactor: new EnableTwoFactorUseCase(users),
        disableTwoFactor: new DisableTwoFactorUseCase(users),
        createPasswordResetToken: new CreatePasswordResetTokenUseCase(users, passwordResetTokens, email),
        resetPassword: new ResetPasswordUseCase(users, passwordResetTokens),
        updatePassword: new UpdatePasswordUseCase(users),
        requestVerification: new RequestVerificationUseCase(users, verificationCodes, email),
        confirmVerification: new ConfirmVerificationUseCase(users, verificationCodes),
        updateProfile: new UpdateProfileUseCase(profiles),
        uploadAvatar: new UploadAvatarUseCase(profiles, storage),
        updateUserStatus: new UpdateUserStatusUseCase(users, sessionTokenService, auditService),
        listUsers: new ListUsersUseCase(users),
        listAdmins: new ListAdminsUseCase(users),
        manageAdmin: new ManageAdminUseCase(users, new CreateAdminUseCase(users, profiles), sessionTokenService, auditService),
        listAuditLogs: new ListAuditLogsUseCase(auditLogs)
    }
}

export type AccountsTestContext = ReturnType<typeof createAccountsTestContext>

/** Cadastra um usuário comum (senha 12345678) e devolve a resposta do cadastro */
export async function registerUser(context: AccountsTestContext, overrides: { email?: string, phoneNumber?: string | null } = {}) {
    return context.register.execute(USER_AGENT, IP, {
        email: overrides.email ?? 'usuario@test.dev',
        password: '12345678',
        name: 'Usuário Teste',
        phoneNumber: overrides.phoneNumber === undefined ? '11987654321' : overrides.phoneNumber
    })
}

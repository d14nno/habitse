import { Router } from 'express'

import { headerAuth } from '@shared/infra/http/middleware/Auth'
import { limiter } from '@shared/infra/http/middleware/RateLimit'
import { uploadSingle } from '@shared/infra/http/middleware/Upload'
import { RegisterAccountController } from '@modules/accounts/useCases/register/RegisterAccountController'
import { GetAccountController } from '@modules/accounts/useCases/getAccount/GetAccountController'
import { UpdatePasswordController } from '@modules/accounts/useCases/updatePassword/UpdatePasswordController'
import { CreatePasswordResetTokenController } from '@modules/accounts/useCases/createPasswordResetToken/CreatePasswordResetTokenController'
import { ResetPasswordController } from '@modules/accounts/useCases/resetPassword/ResetPasswordController'
import { RequestVerificationController } from '@modules/accounts/useCases/requestVerification/RequestVerificationController'
import { ConfirmVerificationController } from '@modules/accounts/useCases/confirmVerification/ConfirmVerificationController'
import { TwoFactorController } from '@modules/accounts/useCases/twoFactor/TwoFactorController'
import { UploadAvatarController } from '@modules/accounts/useCases/uploadAvatar/UploadAvatarController'
import { UpdateProfileController } from '@modules/users/profiles/useCases/updateProfile/UpdateProfileController'

const AccountsRoutes = Router()

AccountsRoutes.post('/accounts', limiter(20), RegisterAccountController.validate, RegisterAccountController.handle)

AccountsRoutes.get('/accounts/me', headerAuth(), GetAccountController.handle)
AccountsRoutes.patch('/accounts/profile', headerAuth(), UpdateProfileController.validate, UpdateProfileController.handle)
AccountsRoutes.post('/accounts/avatar', headerAuth(), uploadSingle('image'), UploadAvatarController.handle)
AccountsRoutes.patch('/accounts/password', headerAuth(), UpdatePasswordController.validate, UpdatePasswordController.handle)

AccountsRoutes.post('/accounts/verifications', headerAuth(), limiter(10), RequestVerificationController.validate, RequestVerificationController.handle)
AccountsRoutes.patch('/accounts/verifications', headerAuth(), limiter(20), ConfirmVerificationController.validate, ConfirmVerificationController.handle)

AccountsRoutes.post('/accounts/2fa', headerAuth(), TwoFactorController.setup)
AccountsRoutes.put('/accounts/2fa', headerAuth(), TwoFactorController.validateCode, TwoFactorController.enable)
AccountsRoutes.delete('/accounts/2fa', headerAuth(), TwoFactorController.validateCode, TwoFactorController.disable)

AccountsRoutes.post('/password-reset-tokens', limiter(10), CreatePasswordResetTokenController.validate, CreatePasswordResetTokenController.handle)
AccountsRoutes.patch('/password-reset-tokens', limiter(10), ResetPasswordController.validate, ResetPasswordController.handle)

export { AccountsRoutes }

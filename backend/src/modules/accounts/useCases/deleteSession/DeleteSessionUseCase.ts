import { inject, injectable } from 'tsyringe'

import { SessionTokenService } from '@modules/accounts/services/SessionTokenService'

@injectable()
export class DeleteSessionUseCase {
    constructor(
        @inject(SessionTokenService)
        private sessionTokenService: SessionTokenService
    ) { }

    async execute(user: Express.Auth.User): Promise<void> {
        await this.sessionTokenService.revokeSession(user.sessionId)
    }
}

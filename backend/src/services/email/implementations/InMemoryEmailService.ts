import { EmailService, SendMailDataDTO } from '../EmailService'

export class InMemoryEmailService implements EmailService {
    private _sentEmails: SendMailDataDTO[] = []

    async sendEmail(data: SendMailDataDTO): Promise<void> {
        this._sentEmails.push(data)
    }

    get sentEmails(): SendMailDataDTO[] {
        return this._sentEmails
    }

    get lastEmail(): SendMailDataDTO | undefined {
        return this._sentEmails[this._sentEmails.length - 1]
    }

    clear(): void {
        this._sentEmails = []
    }
}

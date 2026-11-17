import nodemailer, { Transporter } from 'nodemailer'

import { config } from '@shared/config'
import { AppError } from '@shared/utils/AppError'
import { EmailService, SendMailDataDTO } from '../EmailService'

/**
 * Envio de e-mails via SMTP.
 * Sem SMTP_HOST/SMTP_USER/SMTP_PASS configurados o e-mail é apenas exibido no console
 * (útil em desenvolvimento).
 */
export class NodemailerEmailService implements EmailService {
    private transporter: Transporter | null = null

    constructor() {
        const host = config.get('smtp.host')
        const user = config.get('smtp.user')
        const pass = config.get('smtp.pass')
        const port = config.get('smtp.port')

        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass }
            })
        }
    }

    async sendEmail({ to, subject, html }: SendMailDataDTO): Promise<void> {
        if (!this.transporter) {
            console.log('\n========================================')
            console.log(`[SMTP SIMULATION] To: ${to.email} | Subject: ${subject}`)
            console.log(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
            console.log('Configure SMTP_HOST, SMTP_USER e SMTP_PASS no .env para enviar e-mails reais.')
            console.log('========================================\n')
            return
        }

        try {
            await this.transporter.sendMail({
                from: config.get('smtp.from'),
                to: to.name ? `"${to.name}" <${to.email}>` : to.email,
                subject,
                html
            })
        } catch (error) {
            console.error('Error sending email via Nodemailer:', error)
            throw new AppError(
                [{ message: 'Falha ao enviar e-mail. Tente novamente mais tarde.', uniqueCode: 'EMAIL:SEND_FAILED' }],
                502
            )
        }
    }
}

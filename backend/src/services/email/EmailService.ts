export interface SendMailDataDTO {
    to: {
        email: string
        name?: string | null
    }
    subject: string
    html: string
}

export interface EmailService {
    sendEmail(data: SendMailDataDTO): Promise<void>
}

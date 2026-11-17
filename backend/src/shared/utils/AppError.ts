import { selectStatus, Status4XXNames, Status5XXNames } from '@shared/helpers/http-status-schema'

import { NextFunction, Response } from '@shared/types/Express'

export interface ISingleError {
    message: string
    uniqueCode: string
    index?: string[]
    details?: {
        [key: string]: any
    }
}

class AppError {
    public readonly errors: ISingleError[] = []

    public readonly statusCode: number = 400

    constructor(error: ISingleError[], statusCode: number | Status4XXNames | Status5XXNames = 400) {
        this.statusCode = typeof statusCode === 'number' ? statusCode : selectStatus(statusCode)

        this.errors = this.errors.concat(error)
    }
}

interface IConfigAppError {
    defaultMessage: 'Erro Interno' | string
    defaultCode: 'internalError' | string
    defaultStatusError: 500 | number | Status4XXNames | Status5XXNames
}

function appErrorMiddleware({
    defaultMessage,
    defaultCode,
    defaultStatusError
}: IConfigAppError): any {
    return (
        error: any,
        _: Request,
        response: Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        next: NextFunction
    ): void | Response => {
        // Erro inesperado: o log da requisição (pino-http) mostra a causa na mesma linha
        if (!(error instanceof AppError)) (response as any).err = error

        if (error instanceof AppError) {
            return response.status(error.statusCode).json({
                errors: error.errors.map(element => {
                    return {
                        uniqueCode: element.uniqueCode,
                        message: element.message,
                        details: element.details,
                        index: element.index
                    }
                })
            })
        }

        const defaultStatusErrorInternal =
            typeof defaultStatusError === 'number'
                ? defaultStatusError
                : selectStatus(defaultStatusError)

        return response.status(error.status || defaultStatusErrorInternal || 500).json({
            errors: [
                {
                    message: defaultMessage || 'Erro Interno',
                    uniqueCode: defaultCode || 'internalError'
                }
            ]
        })
    }
}

export { AppError, appErrorMiddleware }

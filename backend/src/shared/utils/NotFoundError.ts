import { Request, Response } from 'express'

type ConfigAppError = {
    defaultMessage: 'Sorry can\'t find that!' | string
}

export const notFoundError = ({ defaultMessage }: ConfigAppError): any => {
    return (_: Request, response: Response): void | Response<any, Record<string, any>> => {
        response.status(404).json({
            errors: [
                {
                    code: 'invalidRoute',
                    message: defaultMessage || 'Sorry can\'t find that!'
                }
            ]
        })
    }
}

export default notFoundError

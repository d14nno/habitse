import { AppError } from '@shared/utils/AppError'

/** Garante que a promise rejeita com um AppError do código (e status) informado. */
export async function expectAppError(promise: Promise<unknown>, uniqueCode: string, statusCode?: number) {
    const error = await promise.then(() => null, err => err)

    expect(error).toBeInstanceOf(AppError)
    expect(error.errors[0].uniqueCode).toBe(uniqueCode)
    if (statusCode) expect(error.statusCode).toBe(statusCode)
}

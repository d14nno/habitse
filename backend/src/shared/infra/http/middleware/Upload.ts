import multer from 'multer'
import { NextFunction, Request, Response } from '@shared/types/Express'
import { AppError } from '@shared/utils/AppError'

const MB = 1024 * 1024

const KINDS = {
    /** Avatar e fotos em geral */
    image: { mimeTypes: /^image\/(jpeg|jpg|png|webp|heic|heif)$/, maxSize: 10 * MB },
    /** Documentos: imagem ou pdf */
    document: { mimeTypes: /^(image\/(jpeg|jpg|png|webp|heic|heif)|application\/pdf)$/, maxSize: 10 * MB },
    /** Planilha de importação: CSV ou Excel (o tipo informado pelo navegador varia; a extensão é conferida na leitura) */
    spreadsheet: { mimeTypes: /^(text\/(csv|plain)|application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|octet-stream|csv))$/, maxSize: 10 * MB },
    /** Imagem ou vídeo curto */
    media: { mimeTypes: /^(image\/(jpeg|jpg|png|webp|heic|heif)|video\/(mp4|quicktime))$/, maxSize: 30 * MB }
} as const

export type UploadKind = keyof typeof KINDS

/**
 * Recebe um arquivo multipart em memória (campo `file` por padrão) e valida tipo/tamanho.
 * O arquivo fica em request.file; o envio ao storage é feito pelo use case via StorageService.
 */
export function uploadSingle(kind: UploadKind, field = 'file', { required = true } = {}) {
    const { mimeTypes, maxSize } = KINDS[kind]

    const handler = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: maxSize, files: 1 },
        fileFilter: (_request, file, callback) => {
            if (mimeTypes.test(file.mimetype)) return callback(null, true)

            callback(new AppError(
                [{ message: 'Tipo de arquivo não permitido', uniqueCode: 'UPLOAD:INVALID_TYPE', details: { mimetype: file.mimetype } }],
                400
            ) as any)
        }
    }).single(field)

    return (request: Request, response: Response, next: NextFunction) => {
        handler(request, response, error => {
            if (error instanceof multer.MulterError) {
                const message = error.code === 'LIMIT_FILE_SIZE' ? `Arquivo maior que ${maxSize / MB} MB` : 'Upload inválido'
                return next(new AppError([{ message, uniqueCode: `UPLOAD:${error.code}` }], 400))
            }

            if (error) return next(error)

            if (required && !request.file) {
                return next(new AppError([{ message: 'Envie o arquivo no campo "file"', uniqueCode: 'UPLOAD:FILE_REQUIRED' }], 400))
            }

            next()
        })
    }
}

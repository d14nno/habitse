import { UploadFileDTO, UploadOptions } from './StorageService'

const CONVERTIBLE_IMAGE = /^image\/(jpeg|jpg|png|webp|heic|heif)$/

/** Converte imagens para webp (menores) e mantém pdf/vídeo como vieram. */
export async function prepareFile(file: UploadFileDTO, { maxImageWidth = 1600 }: UploadOptions = {}) {
    if (CONVERTIBLE_IMAGE.test(file.mimetype)) {
        // Carregado sob demanda: módulo nativo pesado, só é necessário quando há imagem
        const { default: sharp } = await import('sharp')

        const buffer = await sharp(file.buffer)
            .rotate()
            .resize({ width: maxImageWidth, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer()

        return { buffer, mimeType: 'image/webp', extension: 'webp' }
    }

    const extension = file.originalName?.split('.').pop()?.toLowerCase() || file.mimetype.split('/')[1] || 'bin'

    return { buffer: file.buffer, mimeType: file.mimetype, extension }
}

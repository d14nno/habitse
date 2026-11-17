export interface UploadFileDTO {
    buffer: Buffer
    mimetype: string
    originalName?: string
}

export interface StoredFile {
    /** Chave do arquivo no storage (usada para remover) */
    key: string
    url: string
    mimeType: string
    size: number
}

export interface UploadOptions {
    /** Imagens são convertidas para webp e redimensionadas para no máximo esta largura */
    maxImageWidth?: number
}

export interface StorageService {
    /** folder: ex. 'avatars', 'documents/12', 'deliveries/proofs' */
    upload(file: UploadFileDTO, folder: string, options?: UploadOptions): Promise<StoredFile>
    delete(key: string): Promise<void>
}

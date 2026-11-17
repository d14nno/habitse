import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

import { config } from '@shared/config'
import { prepareFile } from '../prepareFile'
import { StorageService, StoredFile, UploadFileDTO, UploadOptions } from '../StorageService'

export const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../../../uploads')

/**
 * Desenvolvimento sem DigitalOcean configurado: grava em ./uploads e é servido em /uploads.
 */
export class LocalStorageService implements StorageService {
    async upload(file: UploadFileDTO, folder: string, options?: UploadOptions): Promise<StoredFile> {
        const { buffer, mimeType, extension } = await prepareFile(file, options)
        const key = `${folder}/${uuidv4()}.${extension}`
        const target = path.join(LOCAL_UPLOADS_DIR, key)

        await fs.promises.mkdir(path.dirname(target), { recursive: true })
        await fs.promises.writeFile(target, buffer)

        return { key, url: `${config.get('application.url')}/uploads/${key}`, mimeType, size: buffer.length }
    }

    async delete(key: string): Promise<void> {
        await fs.promises.rm(path.join(LOCAL_UPLOADS_DIR, key), { force: true })
    }
}

import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { v4 as uuidv4 } from 'uuid'

import { config } from '@shared/config'
import { logger } from '@shared/infra/logger'
import { AppError } from '@shared/utils/AppError'
import { prepareFile } from '../prepareFile'
import { StorageService, StoredFile, UploadFileDTO, UploadOptions } from '../StorageService'

/** DigitalOcean Spaces ou qualquer storage compatível com S3. */
export class S3StorageService implements StorageService {
    private s3 = new S3Client({
        endpoint: config.get('digitalOcean.endpoint'),
        credentials: {
            accessKeyId: config.get('digitalOcean.accessKeyId'),
            secretAccessKey: config.get('digitalOcean.secretAccessKey')
        },
        region: config.get('digitalOcean.region')
    })

    private bucket = config.get('digitalOcean.bucket')

    async upload(file: UploadFileDTO, folder: string, options?: UploadOptions): Promise<StoredFile> {
        const { buffer, mimeType, extension } = await prepareFile(file, options)
        const key = `${config.get('storage.pathPrefix')}/${folder}/${uuidv4()}.${extension}`

        try {
            await this.s3.send(new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: buffer,
                ACL: 'public-read',
                ContentType: mimeType,
                CacheControl: 'public, max-age=31536000'
            }))
        } catch (error) {
            logger.error({ err: error, key }, 'S3 upload failed')
            throw new AppError([{ message: 'Falha ao enviar o arquivo', uniqueCode: 'STORAGE:UPLOAD_FAILED' }], 502)
        }

        return {
            key,
            url: `${config.get('digitalOcean.endpoint')}/${this.bucket}/${key}`,
            mimeType,
            size: buffer.length
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
        } catch (error) {
            logger.warn({ err: error, key }, 'S3 delete failed')
        }
    }
}

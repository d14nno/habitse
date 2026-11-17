import { StorageService, StoredFile, UploadFileDTO } from '../StorageService'

export class InMemoryStorageService implements StorageService {
    public files = new Map<string, StoredFile>()
    private counter = 1

    async upload(file: UploadFileDTO, folder: string): Promise<StoredFile> {
        const key = `${folder}/file-${this.counter++}`
        const stored = { key, url: `https://storage.test/${key}`, mimeType: file.mimetype, size: file.buffer.length }
        this.files.set(key, stored)
        return stored
    }

    async delete(key: string): Promise<void> {
        this.files.delete(key)
    }
}

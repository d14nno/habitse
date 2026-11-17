import { container } from 'tsyringe'
import { config } from '@shared/config'
import { EmailService } from '@services/email/EmailService'
import { NodemailerEmailService } from '@services/email/implementations/NodemailerEmailService'
import { GeoLocationService } from '@services/geoLocation/GeoLocationService'
import { IpApiGeoLocationService } from '@services/geoLocation/implementation/IpApiGeoLocationService'
import { StorageService } from '@services/storage/StorageService'
import { S3StorageService } from '@services/storage/implementations/S3StorageService'
import { LocalStorageService } from '@services/storage/implementations/LocalStorageService'

const hasSpaces = !!(config.get('digitalOcean.endpoint') && config.get('digitalOcean.accessKeyId') && config.get('digitalOcean.bucket'))

container.registerSingleton<EmailService>('EmailService', NodemailerEmailService)
container.registerSingleton<GeoLocationService>('GeoLocationService', IpApiGeoLocationService)
// Sem DigitalOcean/S3 configurado os arquivos ficam em ./uploads (desenvolvimento)
container.registerSingleton<StorageService>('StorageService', hasSpaces ? S3StorageService : LocalStorageService)

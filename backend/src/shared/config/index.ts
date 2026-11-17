import convict from 'convict'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, './../../../.env') })

const config = convict({
    environment: {
        doc: 'The application environment.',
        format: ['production', 'development', 'test'],
        default: 'development',
        env: 'NODE_ENV'
    },
    port: {
        doc: 'The port to bind.',
        format: 'port',
        default: 3333,
        env: 'PORT',
        arg: 'port'
    },
    hashAuthSecret: {
        doc: 'Secret used to sign the JWT tokens.',
        format: String,
        default: '',
        env: 'HASH_AUTH_SECRET'
    },
    redis: {
        cacheUri: {
            doc: 'The redis cache uri.',
            format: '*',
            default: '',
            env: 'REDIS_CACHE_URI'
        },
        keyPrefix: {
            doc: 'Prefix of every Redis key (useful when the Redis is shared by several projects)',
            format: String,
            default: 'app',
            env: 'REDIS_KEY_PREFIX'
        }
    },
    db: {
        url: {
            doc: 'Database url postgres',
            format: '*',
            default: '',
            env: 'DATABASE_URL'
        },
        test: {
            url: {
                doc: 'Database url test postgres',
                format: '*',
                default: '',
                env: 'TEST_DATABASE_URL'
            }
        }
    },
    application: {
        name: {
            doc: 'Application name (e-mails, 2FA issuer, Swagger title)',
            format: String,
            default: 'Minha API',
            env: 'APP_NAME'
        },
        version: {
            doc: 'Application version',
            format: String,
            default: '0.0.1',
            env: 'npm_package_version'
        },
        siteUrl: {
            doc: 'Endereço público do site (links do sitemap)',
            format: String,
            default: 'https://habitse.com.br',
            env: 'SITE_URL'
        },
        url: {
            doc: 'Public URL of this API',
            format: String,
            default: 'http://localhost:3333',
            env: 'APP_URL'
        },
        logLevel: {
            doc: 'Pino log level',
            format: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
            default: 'info',
            env: 'LOG_LEVEL'
        },
        enableDocs: {
            doc: 'Serves Swagger UI at /docs and the OpenAPI spec at /docs/openapi.json in production (always enabled outside production)',
            format: Boolean,
            default: false,
            env: 'ENABLE_API_DOCS'
        }
    },
    storage: {
        pathPrefix: {
            doc: 'Folder prefix inside the bucket',
            format: String,
            default: 'app',
            env: 'STORAGE_PATH_PREFIX'
        }
    },
    digitalOcean: {
        endpoint: { doc: 'DigitalOcean Spaces endpoint', format: String, default: '', env: 'DIGITAL_OCEAN_ENDPOINT' },
        accessKeyId: { doc: 'Spaces key', format: String, default: '', env: 'DIGITAL_OCEAN_ACCESS_KEY_ID' },
        secretAccessKey: { doc: 'Spaces secret', format: String, default: '', env: 'DIGITAL_OCEAN_SECRET_ACCESS_KEY', sensitive: true },
        bucket: { doc: 'Spaces bucket', format: String, default: '', env: 'DIGITAL_OCEAN_BUCKET' },
        region: { doc: 'Spaces region', format: String, default: 'nyc3', env: 'DIGITAL_OCEAN_REGION' }
    },
    cors: {
        origins: {
            doc: 'Sites autorizados a chamar a API (separados por vírgula). Vazio = qualquer origem (apenas desenvolvimento)',
            format: String,
            default: '',
            env: 'CORS_ORIGINS'
        }
    },
    sentry: {
        dsn: {
            doc: 'Sentry DSN',
            format: String,
            default: '',
            env: 'SENTRY_DSN'
        }
    },
    smtp: {
        host: {
            doc: 'SMTP host. Without host/user/pass the emails are only logged in the console.',
            format: String,
            default: '',
            env: 'SMTP_HOST'
        },
        port: {
            doc: 'SMTP port',
            format: 'port',
            default: 587,
            env: 'SMTP_PORT'
        },
        user: {
            doc: 'SMTP user',
            format: String,
            default: '',
            env: 'SMTP_USER'
        },
        pass: {
            doc: 'SMTP password',
            format: String,
            default: '',
            env: 'SMTP_PASS',
            sensitive: true
        },
        from: {
            doc: 'Sender used on the emails',
            format: String,
            default: 'Minha API <naoresponder@exemplo.com.br>',
            env: 'SMTP_FROM'
        }
    }
})

export { config }

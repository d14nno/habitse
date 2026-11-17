import 'dotenv/config'
import 'reflect-metadata'
import http from 'http'
import { config } from '@shared/config'
import { logger } from '@shared/infra/logger'
import Application from '@shared/infra/http/app'

const port = config.get('port')

const server = http.createServer(Application.express)

server.listen(port, () => {
    logger.info({ port }, '🚀 Server started')

})

server.on('error', error => {
    logger.fatal({ err: error }, 'Error on start server')
})

/* eslint-disable no-console */
/**
 * Cria um administrador (super_admin) do painel.
 * Uso: npm run admin:create -- <email> <senha> "<nome>"
 */
import 'dotenv/config'
import 'reflect-metadata'
import { container } from 'tsyringe'

import '@shared/containers'
import { connection } from '@shared/infra/knex'
import { getRedisClient } from '@shared/infra/redis'
import { AppError } from '@shared/utils/AppError'
import { CreateAdminUseCase } from '@modules/accounts/useCases/createAdmin/CreateAdminUseCase'

async function main() {
    const [email, password, name] = process.argv.slice(2)

    try {
        const admin = await container.resolve(CreateAdminUseCase).execute({ email, password, name })
        console.log(`✅ Administrador criado: #${admin.id} ${admin.email}`)
    } catch (error) {
        console.error('❌', error instanceof AppError ? error.errors[0].message : error)
        process.exitCode = 1
    } finally {
        await connection.destroy()
        getRedisClient().disconnect()
        process.exit()
    }
}

main()

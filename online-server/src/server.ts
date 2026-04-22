import { loadEnv, missingControlDatabaseMessage } from './config/env.js'
import { buildApp } from './app.js'
import { closeControlDb } from './db/controlDb.js'
import { closeTenantPools } from './db/tenantDb.js'

try {
  const env = loadEnv()
  const app = await buildApp()
  await app.listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  console.log(`[ysale-online-api] listening on port ${env.PORT}`)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('CONTROL_DATABASE_URL')) {
    console.error(missingControlDatabaseMessage)
  } else {
    console.error(message)
  }
  process.exitCode = 1
}

const shutdown = async () => {
  await closeTenantPools().catch(() => {})
  await closeControlDb().catch(() => {})
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

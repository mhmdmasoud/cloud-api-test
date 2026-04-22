import type { FastifyInstance } from 'fastify'
import { tenantMiddleware } from '../middlewares/tenant.middleware.js'
import { getTenantDatabaseUrl } from '../services/tenantDatabase.service.js'
import { maskDatabaseUrl } from '../utils/crypto.js'

export const registerOnlineSettingsRoutes = async (app: FastifyInstance) => {
  app.get('/online-settings/status', { preHandler: tenantMiddleware }, async (request) => {
    const databaseUrl = await getTenantDatabaseUrl(request.tenantUser!.tenantId)
    return {
      success: true,
      tenantId: request.tenantUser!.tenantId,
      tenantCode: request.tenantUser!.tenantCode,
      databaseType: 'postgres',
      tenantDatabaseUrlMasked: maskDatabaseUrl(databaseUrl),
    }
  })
}

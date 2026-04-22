import type { FastifyInstance } from 'fastify'
import { tenantMiddleware } from '../middlewares/tenant.middleware.js'
import { getTenantLicenseStatus } from '../services/tenants.service.js'

export const registerLicenseRoutes = async (app: FastifyInstance) => {
  for (const routePath of ['/license/status', '/api/license/status', '/api/v1/license/status']) {
    app.get(routePath, { preHandler: tenantMiddleware }, async (request) => {
      return getTenantLicenseStatus(request.tenantUser!.tenantId, request.tenantUser!.deviceId)
    })
  }
}

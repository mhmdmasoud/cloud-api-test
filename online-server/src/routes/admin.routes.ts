import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { loginSystemAdmin } from '../services/admin.service.js'
import { getTenantDashboard, listTenants } from '../services/tenants.service.js'
import { adminMiddleware } from '../middlewares/admin.middleware.js'

const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export const registerAdminRoutes = async (app: FastifyInstance) => {
  const loginPaths = ['/admin/login', '/api/admin/login', '/api/v1/admin/login']
  const dashboardPaths = ['/admin/dashboard', '/api/admin/dashboard', '/api/v1/admin/dashboard']
  const tenantsPaths = ['/admin/tenants', '/api/admin/tenants', '/api/v1/admin/tenants']

  for (const routePath of loginPaths) {
    app.post(routePath, async (request) => {
      const body = adminLoginSchema.parse(request.body)
      return loginSystemAdmin(body.username, body.password)
    })
  }

  for (const routePath of dashboardPaths) {
    app.get(routePath, { preHandler: adminMiddleware }, async () => getTenantDashboard())
  }

  for (const routePath of tenantsPaths) {
    app.get(routePath, { preHandler: adminMiddleware }, async () => listTenants())
  }
}

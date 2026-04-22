import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { adminMiddleware } from '../middlewares/admin.middleware.js'
import {
  createOrResetTenantAdminUser,
  createTenant,
  getTenantById,
  getTenantDevices,
  updateTenant,
  updateTenantLicense,
  updateTenantStatus,
  updateTenantSubscription,
} from '../services/tenants.service.js'
import { deleteTenantDevice, updateTenantDeviceStatus } from '../services/devices.service.js'

const tenantIdParamsSchema = z.object({
  id: z.string().uuid(),
})

const createTenantSchema = z.object({
  tenantCode: z.string().min(1),
  companyName: z.string().min(1),
  ownerName: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
  adminUsername: z.string().min(1),
  adminPassword: z.string().min(6),
  adminFullName: z.string().optional().default('Tenant Admin'),
  operationMode: z.string().optional().default('online'),
  allowedDevices: z.coerce.number().int().positive().optional().default(1),
  trialDays: z.coerce.number().int().positive().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  status: z.string().optional().default('active'),
  subscriptionStatus: z.string().optional().default('active'),
  tenantDatabaseUrl: z.string().optional().default(''),
  serverUrl: z.string().optional().default(''),
  serverPort: z.coerce.number().int().positive().optional().default(47821),
  serverHost: z.string().optional().default('0.0.0.0'),
  databasePath: z.string().optional().default(''),
  useTailscale: z.boolean().optional().default(false),
  autoStartServer: z.boolean().optional().default(false),
  autoStartOnWindows: z.boolean().optional().default(false),
})

const updateTenantSchema = createTenantSchema.partial()

const statusSchema = z.object({
  status: z.enum(['active', 'trial', 'suspended', 'expired']),
})

const subscriptionSchema = z.object({
  expiresAt: z.string().optional().nullable(),
})

const licenseSchema = z.object({
  status: z.enum(['active', 'trial', 'suspended', 'expired']).optional(),
  subscriptionStatus: z.enum(['active', 'trial', 'suspended', 'expired']).optional(),
  allowedDevices: z.coerce.number().int().positive().optional(),
  expiresAt: z.string().nullable().optional(),
  startsAt: z.string().nullable().optional(),
  operationMode: z.string().optional(),
})

const adminUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  fullName: z.string().optional().default('Tenant Admin'),
})

const deviceParamsSchema = z.object({
  id: z.string().uuid(),
  deviceId: z.string().uuid(),
})

const deviceStatusSchema = z.object({
  isActive: z.boolean(),
})

export const registerTenantsRoutes = async (app: FastifyInstance) => {
  const createPaths = ['/admin/tenants', '/api/admin/tenants', '/api/v1/admin/tenants']
  const itemPaths = ['/admin/tenants/:id', '/api/admin/tenants/:id', '/api/v1/admin/tenants/:id']
  const statusPaths = ['/admin/tenants/:id/status', '/api/admin/tenants/:id/status', '/api/v1/admin/tenants/:id/status']
  const subscriptionPaths = ['/admin/tenants/:id/subscription', '/api/admin/tenants/:id/subscription', '/api/v1/admin/tenants/:id/subscription']
  const licensePaths = ['/admin/tenants/:id/license', '/api/admin/tenants/:id/license', '/api/v1/admin/tenants/:id/license']
  const devicesPaths = ['/admin/tenants/:id/devices', '/api/admin/tenants/:id/devices', '/api/v1/admin/tenants/:id/devices']
  const adminUserPaths = ['/admin/tenants/:id/admin-user', '/api/admin/tenants/:id/admin-user', '/api/v1/admin/tenants/:id/admin-user']
  const deviceStatusPaths = ['/admin/tenants/:id/devices/:deviceId/status', '/api/admin/tenants/:id/devices/:deviceId/status', '/api/v1/admin/tenants/:id/devices/:deviceId/status']
  const deviceDeletePaths = ['/admin/tenants/:id/devices/:deviceId', '/api/admin/tenants/:id/devices/:deviceId', '/api/v1/admin/tenants/:id/devices/:deviceId']

  for (const routePath of createPaths) {
    app.post(routePath, { preHandler: adminMiddleware }, async (request) => {
      const body = createTenantSchema.parse(request.body)
      return createTenant(body)
    })
  }

  for (const routePath of itemPaths) {
    app.get(routePath, { preHandler: adminMiddleware }, async (request) => {
      const params = tenantIdParamsSchema.parse(request.params)
      return getTenantById(params.id, { includeSecrets: true })
    })
    app.put(routePath, { preHandler: adminMiddleware }, async (request) => {
      const params = tenantIdParamsSchema.parse(request.params)
      const body = updateTenantSchema.parse(request.body)
      return updateTenant(params.id, body)
    })
  }

  for (const routePath of statusPaths) {
    app.patch(routePath, { preHandler: adminMiddleware }, async (request) => {
      const params = tenantIdParamsSchema.parse(request.params)
      const body = statusSchema.parse(request.body)
      return updateTenantStatus(params.id, body.status)
    })
  }

  for (const routePath of subscriptionPaths) {
    app.patch(routePath, { preHandler: adminMiddleware }, async (request) => {
      const params = tenantIdParamsSchema.parse(request.params)
      const body = subscriptionSchema.parse(request.body)
      return updateTenantSubscription(params.id, body.expiresAt || null)
    })
  }

  for (const routePath of licensePaths) {
    app.patch(routePath, { preHandler: adminMiddleware }, async (request) => {
      const params = tenantIdParamsSchema.parse(request.params)
      const body = licenseSchema.parse(request.body)
      return updateTenantLicense(params.id, body)
    })
  }

  for (const routePath of devicesPaths) {
    app.get(routePath, { preHandler: adminMiddleware }, async (request) => {
      const params = tenantIdParamsSchema.parse(request.params)
      return getTenantDevices(params.id)
    })
  }

  for (const routePath of adminUserPaths) {
    app.post(routePath, { preHandler: adminMiddleware }, async (request) => {
      const params = tenantIdParamsSchema.parse(request.params)
      const body = adminUserSchema.parse(request.body)
      return createOrResetTenantAdminUser(params.id, body)
    })
  }

  for (const routePath of deviceStatusPaths) {
    app.patch(routePath, { preHandler: adminMiddleware }, async (request) => {
      const params = deviceParamsSchema.parse(request.params)
      const body = deviceStatusSchema.parse(request.body)
      return updateTenantDeviceStatus(params.id, params.deviceId, body.isActive)
    })
  }

  for (const routePath of deviceDeletePaths) {
    app.delete(routePath, { preHandler: adminMiddleware }, async (request) => {
      const params = deviceParamsSchema.parse(request.params)
      return deleteTenantDevice(params.id, params.deviceId)
    })
  }
}

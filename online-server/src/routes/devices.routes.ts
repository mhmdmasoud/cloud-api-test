import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { tenantMiddleware } from '../middlewares/tenant.middleware.js'
import { listTenantDevices, registerTenantDevice } from '../services/devices.service.js'

const registerDeviceSchema = z.object({
  deviceId: z.string().min(1),
  deviceName: z.string().optional().default(''),
  windowsUsername: z.string().optional().default(''),
  machineFingerprint: z.string().optional().default(''),
})

export const registerDevicesRoutes = async (app: FastifyInstance) => {
  for (const routePath of ['/devices', '/api/devices', '/api/v1/devices']) {
    app.get(routePath, { preHandler: tenantMiddleware }, async (request) => {
      return listTenantDevices(request.tenantUser!.tenantId)
    })
  }

  for (const routePath of ['/devices/register', '/api/devices/register', '/api/v1/devices/register']) {
    app.post(routePath, { preHandler: tenantMiddleware }, async (request) => {
      const body = registerDeviceSchema.parse(request.body)
      const device = await registerTenantDevice({
        tenantId: request.tenantUser!.tenantId,
        userId: request.tenantUser!.userId,
        deviceId: body.deviceId,
        deviceName: body.deviceName,
        windowsUsername: body.windowsUsername,
        machineFingerprint: body.machineFingerprint,
        ipAddress: String(request.ip || ''),
      })
      return { success: true, device }
    })
  }
}

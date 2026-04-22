import type { IncomingMessage, ServerResponse } from 'node:http'
import { controlDb } from '../../../src/db/controlDb.js'
import {
  ensureControlDbReady,
  readJsonBody,
  requireAdminBearer,
  sendApiError,
  sendJson,
  sendMethodNotAllowed,
} from '../../_shared.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res)
    return
  }

  try {
    await ensureControlDbReady()
    requireAdminBearer(req)
    const body = await readJsonBody(req)
    const tenantCode = String(body.tenantCode || '').trim().toUpperCase()
    const allowedDevices = Math.max(1, Math.round(Number(body.allowedDevices || 1)))
    if (!tenantCode || !Number.isFinite(allowedDevices)) {
      sendJson(res, 400, {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'tenantCode and allowedDevices are required',
      })
      return
    }

    const result = await controlDb.query(
      `
        UPDATE tenants
        SET allowed_devices = $2, updated_at = NOW()
        WHERE tenant_code = $1
        RETURNING id, tenant_code, company_name, allowed_devices
      `,
      [tenantCode, allowedDevices],
    )
    const tenant = result.rows[0]
    if (!tenant) {
      sendJson(res, 404, {
        success: false,
        errorCode: 'TENANT_NOT_FOUND',
        message: 'Tenant not found',
      })
      return
    }

    sendJson(res, 200, {
      success: true,
      tenant: {
        id: tenant.id,
        tenantCode: tenant.tenant_code,
        companyName: tenant.company_name,
        allowedDevices: Number(tenant.allowed_devices || 1),
      },
    })
  } catch (error) {
    sendApiError(res, error)
  }
}

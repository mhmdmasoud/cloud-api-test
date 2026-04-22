import type { IncomingMessage, ServerResponse } from 'node:http'
import { loginTenantUser } from '../../../src/services/auth.service.js'
import { readJsonBody, sendApiError, sendJson, sendMethodNotAllowed } from '../../_shared.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res)
    return
  }

  try {
    const body = await readJsonBody(req)
    const result = await loginTenantUser({
      tenantCode: String(body.tenantCode || ''),
      username: String(body.username || ''),
      password: String(body.password || ''),
      deviceId: String(body.deviceId || ''),
      deviceName: String(body.deviceName || ''),
      windowsUsername: String(body.windowsUsername || ''),
      machineFingerprint: String(body.machineFingerprint || ''),
      ipAddress: String(req.socket.remoteAddress || ''),
    })
    sendJson(res, 200, result)
  } catch (error) {
    sendApiError(res, error)
  }
}

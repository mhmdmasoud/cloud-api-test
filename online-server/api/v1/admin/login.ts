import type { IncomingMessage, ServerResponse } from 'node:http'
import { loginSystemAdmin } from '../../../src/services/admin.service.js'
import { readJsonBody, sendApiError, sendJson, sendMethodNotAllowed } from '../../_shared.js'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res)
    return
  }

  try {
    const body = await readJsonBody(req)
    const result = await loginSystemAdmin(String(body.username || ''), String(body.password || ''))
    sendJson(res, 200, result)
  } catch (error) {
    sendApiError(res, error)
  }
}

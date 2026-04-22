import type { IncomingMessage, ServerResponse } from 'node:http'
import { migrateControlDb, seedSystemAdmin } from '../src/db/migrations.js'
import { AppError } from '../src/utils/errors.js'

let controlDbReadyPromise: Promise<void> | null = null

export const readJsonBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim()
  return raw ? JSON.parse(raw) : {}
}

export const sendJson = (res: ServerResponse, statusCode: number, payload: unknown) => {
  res.statusCode = statusCode
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

export const sendMethodNotAllowed = (res: ServerResponse, allowed = 'POST') => {
  res.setHeader('allow', allowed)
  sendJson(res, 405, {
    success: false,
    errorCode: 'METHOD_NOT_ALLOWED',
    message: 'Method not allowed',
  })
}

export const sendApiError = (res: ServerResponse, error: unknown) => {
  if (error instanceof AppError) {
    sendJson(res, error.statusCode, {
      success: false,
      errorCode: error.errorCode,
      message: error.message,
    })
    return
  }

  const message = error instanceof Error ? error.message : String(error || 'Internal server error')
  sendJson(res, 500, {
    success: false,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message,
  })
}

export const getRequestIp = (req: IncomingMessage) => {
  const forwardedFor = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const forwardedValue = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor
  const realIpValue = Array.isArray(realIp) ? realIp[0] : realIp
  return String(forwardedValue || realIpValue || req.socket?.remoteAddress || '')
    .split(',')[0]
    .trim()
}

export const ensureControlDbReady = async () => {
  if (!controlDbReadyPromise) {
    controlDbReadyPromise = (async () => {
      await migrateControlDb()
      await seedSystemAdmin()
    })()
  }
  await controlDbReadyPromise
}

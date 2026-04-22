import type { IncomingMessage, ServerResponse } from 'node:http'
import { AppError } from '../src/utils/errors.js'

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

import type { IncomingMessage, ServerResponse } from 'node:http'
import { buildApp } from '../../../src/app.js'

let appPromise: ReturnType<typeof buildApp> | null = null

const getApp = async () => {
  if (!appPromise) {
    appPromise = buildApp().then(async (app) => {
      await app.ready()
      return app
    })
  }
  return appPromise
}

const hasBearerToken = (req: IncomingMessage) => {
  const authorization = req.headers.authorization
  const value = Array.isArray(authorization) ? authorization[0] : authorization
  return typeof value === 'string' && value.toLowerCase().startsWith('bearer ')
}

const sendUnauthorized = (res: ServerResponse) => {
  res.statusCode = 401
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(
    JSON.stringify({
      success: false,
      errorCode: 'UNAUTHORIZED',
      message: 'Unauthorized',
    }),
  )
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!hasBearerToken(req)) {
    sendUnauthorized(res)
    return
  }

  const app = await getApp()
  app.server.emit('request', req, res)
}

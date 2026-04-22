import type { FastifyReply, FastifyRequest } from 'fastify'
import { unauthorized } from '../utils/errors.js'
import { type AdminJwtPayload, type TenantJwtPayload, verifyToken } from '../utils/jwt.js'

declare module 'fastify' {
  interface FastifyRequest {
    admin?: AdminJwtPayload
    tenantUser?: TenantJwtPayload
  }
}

const extractBearerToken = (request: FastifyRequest) => {
  const authHeader = String(request.headers.authorization || '')
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw unauthorized()
  }
  return authHeader.slice(7).trim()
}

export const requireAdminToken = async (request: FastifyRequest, _reply: FastifyReply) => {
  const token = extractBearerToken(request)
  const payload = verifyToken<AdminJwtPayload>(token)
  if (payload.tokenType !== 'system-admin') {
    throw unauthorized()
  }
  request.admin = payload
}

export const requireTenantToken = async (request: FastifyRequest, _reply: FastifyReply) => {
  const token = extractBearerToken(request)
  const payload = verifyToken<TenantJwtPayload>(token)
  if (payload.tokenType !== 'tenant-user') {
    throw unauthorized()
  }
  request.tenantUser = payload
}

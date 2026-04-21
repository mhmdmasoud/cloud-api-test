import { verifyToken } from "./jwt.js";

function authError(message) {
  const error = new Error(message);
  error.statusCode = 401;
  return error;
}

export function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;

  if (!header || typeof header !== "string") {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function requireAdmin(req) {
  const token = getBearerToken(req);

  if (!token) {
    throw authError("Missing Bearer token");
  }

  const payload = verifyToken(token);

  if (!payload || payload.type !== "admin") {
    throw authError("Invalid admin token");
  }

  return payload;
}

export function requireTenant(req) {
  const token = getBearerToken(req);

  if (!token) {
    throw authError("Missing Bearer token");
  }

  const payload = verifyToken(token);

  if (!payload || payload.type !== "tenant") {
    throw authError("Invalid tenant token");
  }

  return payload;
}

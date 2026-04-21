import jwt from "jsonwebtoken";

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
}

export function signAdminToken(payload) {
  return jwt.sign(
    {
      type: "admin",
      ...payload
    },
    getJwtSecret(),
    { expiresIn: "7d" }
  );
}

export function signTenantToken(payload) {
  return jwt.sign(
    {
      type: "tenant",
      ...payload
    },
    getJwtSecret(),
    { expiresIn: "30d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

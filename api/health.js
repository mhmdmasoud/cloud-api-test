import { ok, handleOptions } from "../lib/response.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  return ok(res, {
    ok: true,
    service: "cloud-api-test",
    mode: "clean-vercel-test",
    runtime: "vercel-api-route-clean",
    env: {
      nodeEnv: process.env.NODE_ENV || null,
      hasControlDatabaseUrl: !!process.env.CONTROL_DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasSystemAdminUsername: !!process.env.SYSTEM_ADMIN_USERNAME,
      hasSystemAdminPassword: !!process.env.SYSTEM_ADMIN_PASSWORD
    },
    databaseConfigured: !!process.env.CONTROL_DATABASE_URL
  });
}

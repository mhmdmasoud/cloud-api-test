import { query } from "../../lib/db.js";
import { hashPassword } from "../../lib/password.js";
import { badRequest, handleOptions, ok, serverError } from "../../lib/response.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return ok(res, { ok: false, error: "Method not allowed" }, 405);

  try {
    const existing = await query("SELECT id FROM system_admins LIMIT 1");

    if (existing.rowCount > 0) {
      return ok(res, { ok: true, created: false });
    }

    const username = process.env.SYSTEM_ADMIN_USERNAME;
    const password = process.env.SYSTEM_ADMIN_PASSWORD;

    if (!username || !password) {
      return badRequest(res, "SYSTEM_ADMIN_USERNAME and SYSTEM_ADMIN_PASSWORD are required");
    }

    const passwordHash = await hashPassword(password);

    await query(
      `
        INSERT INTO system_admins (username, password_hash, full_name)
        VALUES ($1, $2, $3)
      `,
      [username, passwordHash, "System Admin"]
    );

    return ok(res, { ok: true, created: true });
  } catch (error) {
    return serverError(res, error);
  }
}

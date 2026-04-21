import { query } from "../../lib/db.js";
import { signAdminToken } from "../../lib/jwt.js";
import { verifyPassword } from "../../lib/password.js";
import { badRequest, handleOptions, ok, unauthorized, serverError, readJson } from "../../lib/response.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return ok(res, { ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await readJson(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return badRequest(res, "username and password are required");
    }

    const result = await query(
      `
        SELECT id, username, full_name, password_hash, is_active
        FROM system_admins
        WHERE username = $1
        LIMIT 1
      `,
      [username]
    );

    if (result.rowCount === 0) {
      return unauthorized(res, "Invalid credentials");
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      return unauthorized(res, "Admin is inactive");
    }

    const validPassword = await verifyPassword(password, admin.password_hash);

    if (!validPassword) {
      return unauthorized(res, "Invalid credentials");
    }

    const token = signAdminToken({
      adminId: admin.id,
      username: admin.username
    });

    return ok(res, {
      ok: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.full_name
      }
    });
  } catch (error) {
    return serverError(res, error);
  }
}

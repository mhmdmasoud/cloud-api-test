import { runControlMigrations } from "../../lib/migrations.js";
import { handleOptions, ok, serverError } from "../../lib/response.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return ok(res, { ok: false, error: "Method not allowed" }, 405);

  try {
    await runControlMigrations();
    return ok(res, {
      ok: true,
      message: "Control database migrations completed"
    });
  } catch (error) {
    return serverError(res, error);
  }
}

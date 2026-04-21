import { requireTenant } from "../../lib/auth.js";
import { handleOptions, ok, unauthorized, serverError } from "../../lib/response.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return ok(res, { ok: false, error: "Method not allowed" }, 405);

  try {
    const payload = requireTenant(req);
    return ok(res, {
      ok: true,
      token: payload
    });
  } catch (error) {
    if (error && error.statusCode === 401) {
      return unauthorized(res, error.message);
    }

    return serverError(res, error);
  }
}

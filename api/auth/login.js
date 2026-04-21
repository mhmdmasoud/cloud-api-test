import { getPool } from "../../lib/db.js";
import { signTenantToken } from "../../lib/jwt.js";
import { verifyPassword } from "../../lib/password.js";
import { badRequest, handleOptions, ok, unauthorized, serverError, readJson } from "../../lib/response.js";

function subscriptionExpired(subscription) {
  if (!subscription || !subscription.expires_at) {
    return false;
  }

  return new Date(subscription.expires_at).getTime() < Date.now();
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return ok(res, { ok: false, error: "Method not allowed" }, 405);

  let client = null;

  try {
    client = await getPool().connect();
    const body = await readJson(req);
    const tenantCode = String(body.tenantCode || "").trim();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const deviceId = String(body.deviceId || "").trim();
    const deviceName = body.deviceName ? String(body.deviceName).trim() : null;

    if (!tenantCode || !username || !password || !deviceId) {
      return badRequest(res, "tenantCode, username, password, and deviceId are required");
    }

    const tenantResult = await client.query(
      `
        SELECT id, tenant_code, company_name, status
        FROM tenants
        WHERE tenant_code = $1
        LIMIT 1
      `,
      [tenantCode]
    );

    if (tenantResult.rowCount === 0) {
      return unauthorized(res, "Tenant not found");
    }

    const tenant = tenantResult.rows[0];

    if (tenant.status !== "active") {
      return unauthorized(res, "Tenant is inactive");
    }

    const subscriptionResult = await client.query(
      `
        SELECT id, status, starts_at, expires_at
        FROM subscriptions
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [tenant.id]
    );

    const subscription = subscriptionResult.rows[0] || null;

    if (!subscription) {
      return unauthorized(res, "Subscription not found");
    }

    if (subscription.status !== "trial" && subscription.status !== "active") {
      return unauthorized(res, "Subscription is inactive");
    }

    if (subscriptionExpired(subscription)) {
      return unauthorized(res, "Subscription expired");
    }

    const userResult = await client.query(
      `
        SELECT id, username, password_hash, full_name, role, permissions, is_active
        FROM users
        WHERE tenant_id = $1 AND username = $2
        LIMIT 1
      `,
      [tenant.id, username]
    );

    if (userResult.rowCount === 0) {
      return unauthorized(res, "Invalid credentials");
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return unauthorized(res, "User is inactive");
    }

    const validPassword = await verifyPassword(password, user.password_hash);

    if (!validPassword) {
      return unauthorized(res, "Invalid credentials");
    }

    await client.query("BEGIN");

    const existingDevice = await client.query(
      `
        SELECT id
        FROM devices
        WHERE tenant_id = $1 AND device_id = $2
        LIMIT 1
      `,
      [tenant.id, deviceId]
    );

    if (existingDevice.rowCount > 0) {
      await client.query(
        `
          UPDATE devices
          SET
            user_id = $1,
            device_name = $2,
            is_active = true,
            last_login_at = now()
          WHERE tenant_id = $3 AND device_id = $4
        `,
        [user.id, deviceName, tenant.id, deviceId]
      );
    } else {
      await client.query(
        `
          INSERT INTO devices (tenant_id, user_id, device_id, device_name, is_active, last_login_at)
          VALUES ($1, $2, $3, $4, true, now())
        `,
        [tenant.id, user.id, deviceId, deviceName]
      );
    }

    await client.query(
      `
        INSERT INTO audit_logs (tenant_id, user_id, device_id, action, entity_type, entity_id, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      `,
      [
        tenant.id,
        user.id,
        deviceId,
        "TENANT_LOGIN",
        "user",
        user.id,
        JSON.stringify({ username: user.username })
      ]
    );

    await client.query("COMMIT");

    const token = signTenantToken({
      tenantId: tenant.id,
      tenantCode: tenant.tenant_code,
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || {},
      deviceId
    });

    return ok(res, {
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        permissions: user.permissions || {}
      },
      tenant: {
        id: tenant.id,
        tenantCode: tenant.tenant_code,
        companyName: tenant.company_name
      }
    });
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK").catch(() => {});
    }
    return serverError(res, error);
  } finally {
    if (client) {
      client.release();
    }
  }
}

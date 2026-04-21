import { getPool } from "../../lib/db.js";
import { requireAdmin } from "../../lib/auth.js";
import { hashPassword } from "../../lib/password.js";
import { badRequest, handleOptions, ok, unauthorized, serverError, readJson } from "../../lib/response.js";

function mapTenant(row) {
  return {
    id: row.id,
    tenantCode: row.tenant_code,
    companyName: row.company_name,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subscriptionStatus: row.subscription_status,
    expiresAt: row.expires_at
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  let admin;
  try {
    admin = requireAdmin(req);
  } catch (error) {
    return unauthorized(res, error.message);
  }

  if (req.method === "GET") {
    try {
      const result = await getPool().query(`
        SELECT
          t.id,
          t.tenant_code,
          t.company_name,
          t.phone,
          t.status,
          t.created_at,
          t.updated_at,
          s.status AS subscription_status,
          s.expires_at
        FROM tenants t
        LEFT JOIN LATERAL (
          SELECT status, expires_at
          FROM subscriptions
          WHERE tenant_id = t.id
          ORDER BY created_at DESC
          LIMIT 1
        ) s ON true
        ORDER BY t.created_at DESC
      `);

      return ok(res, {
        ok: true,
        tenants: result.rows.map(mapTenant)
      });
    } catch (error) {
      return serverError(res, error);
    }
  }

  if (req.method !== "POST") {
    return ok(res, { ok: false, error: "Method not allowed" }, 405);
  }

  let client = null;

  try {
    client = await getPool().connect();
    const body = await readJson(req);
    const tenantCode = String(body.tenantCode || "").trim();
    const companyName = String(body.companyName || "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const adminUsername = String(body.adminUsername || "").trim();
    const adminPassword = String(body.adminPassword || "");
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const tenantDatabaseUrl = String(body.tenantDatabaseUrl || "").trim();

    if (!tenantCode || !companyName || !adminUsername || !adminPassword || !tenantDatabaseUrl) {
      return badRequest(
        res,
        "tenantCode, companyName, adminUsername, adminPassword, and tenantDatabaseUrl are required"
      );
    }

    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      return badRequest(res, "expiresAt is invalid");
    }

    await client.query("BEGIN");

    const tenantResult = await client.query(
      `
        INSERT INTO tenants (tenant_code, company_name, phone)
        VALUES ($1, $2, $3)
        RETURNING id, tenant_code, company_name, phone, status, created_at, updated_at
      `,
      [tenantCode, companyName, phone]
    );

    const tenant = tenantResult.rows[0];
    const passwordHash = await hashPassword(adminPassword);

    await client.query(
      `
        INSERT INTO tenant_databases (tenant_id, database_url)
        VALUES ($1, $2)
      `,
      [tenant.id, tenantDatabaseUrl]
    );

    const userResult = await client.query(
      `
        INSERT INTO users (tenant_id, username, password_hash, full_name, role, permissions)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING id, username, full_name, role, permissions
      `,
      [tenant.id, adminUsername, passwordHash, "Tenant Admin", "admin", JSON.stringify({ "*" : true })]
    );

    await client.query(
      `
        INSERT INTO subscriptions (tenant_id, status, expires_at)
        VALUES ($1, $2, $3)
      `,
      [tenant.id, "trial", expiresAt ? expiresAt.toISOString() : null]
    );

    await client.query(
      `
        INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, details)
        VALUES ($1, NULL, $2, $3, $4, $5::jsonb)
      `,
      [
        tenant.id,
        "ADMIN_CREATE_TENANT",
        "tenant",
        tenant.id,
        JSON.stringify({
          adminId: admin.adminId,
          adminUsername: admin.username
        })
      ]
    );

    await client.query("COMMIT");

    return ok(res, {
      ok: true,
      tenant: {
        ...mapTenant({
          ...tenant,
          subscription_status: "trial",
          expires_at: expiresAt ? expiresAt.toISOString() : null
        }),
        adminUser: {
          id: userResult.rows[0].id,
          username: userResult.rows[0].username,
          fullName: userResult.rows[0].full_name,
          role: userResult.rows[0].role,
          permissions: userResult.rows[0].permissions
        }
      }
    }, 201);
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

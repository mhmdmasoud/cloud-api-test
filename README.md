# Cloud API Test

Test endpoint:

/api/health

## Vercel Environment Variables

- CONTROL_DATABASE_URL
- JWT_SECRET
- SYSTEM_ADMIN_USERNAME
- SYSTEM_ADMIN_PASSWORD

## First Run

1. `POST /api/admin/migrate`
2. `POST /api/admin/seed`
3. `POST /api/admin/login`

## Add Tenant

- `POST /api/admin/tenants`

## Tenant Login

- `POST /api/auth/login`

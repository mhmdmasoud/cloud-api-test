export default function handler(req, res) {
  return res.status(200).json({
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
    }
  });
}

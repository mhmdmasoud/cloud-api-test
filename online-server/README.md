# YSale Online API

سيرفر API مستقل لتأسيس Online Mode في YSale. يستخدم PostgreSQL كـ Control Database لإدارة العملاء، المستخدمين، الاشتراكات، الأجهزة، وسجلات الترحيل فقط. بيانات العميل الفعلية لا تُخزن في Control Database، بل في Tenant Database الخاصة بكل عميل.

## التشغيل المحلي

1. انسخ `.env.local.example` إلى `.env`.
2. افتح `.env`.
3. ضع رابط Supabase PostgreSQL مكان:
   `PUT_YOUR_SUPABASE_DATABASE_URL_HERE`
4. شغل:

```bash
npm install
npm run migrate
npm run seed
npm run dev
```

5. افتح:

```text
http://localhost:4545/health
```

## System Admin

بعد تشغيل `npm run seed` يتم إنشاء أول System Admin من:

```text
SYSTEM_ADMIN_USERNAME
SYSTEM_ADMIN_PASSWORD
```

تسجيل دخول الأدمن:

```bash
curl -X POST http://localhost:4545/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"123456789\"}"
```

## إضافة أول عميل

استخدم التوكن الناتج من `/admin/login`:

```bash
curl -X POST http://localhost:4545/admin/tenants \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"tenantCode\":\"TIME001\",\"companyName\":\"Time Computer\",\"phone\":\"01000000000\",\"adminUsername\":\"admin\",\"adminPassword\":\"123456\",\"expiresAt\":\"2026-12-31\",\"tenantDatabaseUrl\":\"postgresql://tenant-db-url\"}"
```

## تسجيل دخول العميل

```bash
curl -X POST http://localhost:4545/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"tenantCode\":\"TIME001\",\"username\":\"admin\",\"password\":\"123456\",\"deviceId\":\"DEVICE-001\",\"deviceName\":\"Front Desk PC\"}"
```

## ترحيل بيانات SQLite إلى Online

افتح البرنامج ثم:

1. الإعدادات.
2. ترحيل البيانات إلى الأونلاين.
3. أدخل Server URL وTenant Code وبيانات أدمن العميل.
4. اضغط اختبار الاتصال.
5. اضغط فحص قاعدة البيانات المحلية.
6. اضغط إنشاء Backup.
7. راجع الأعداد والإجماليات.
8. فعّل تأكيد إيقاف العمل وأخذ النسخة الاحتياطية.
9. اضغط بدء الترحيل.
10. راجع التقرير النهائي وسجل الترحيلات.

Endpoints الخاصة بالترحيل:

```text
POST /migration/validate
POST /migration/check-existing
POST /migration/init
POST /migration/prepare-tenant-db
POST /migration/batch
POST /migration/finalize
GET  /migration/:migrationId/status
GET  /migration/:migrationId/report
POST /migration/:migrationId/cancel
```

جداول Control Database الخاصة بالترحيل:

```text
migration_jobs
migration_batches
migration_entity_stats
```

داخل Tenant Database يتم إنشاء جداول staging آمنة:

```text
ysale_migration_records
ysale_migration_meta
```

هذه الجداول تحفظ نسخة JSON كاملة من سجلات SQLite حسب نوع الكيان مع `migration_id` و`legacy_id`. هذا يؤسس الترحيل الآمن والقابل للتتبع، ويجب توسيع mapping النهائي لاحقًا إذا كان المطلوب تشغيل الفواتير والمخزون Online على schema علائقي مطابق 100%.

## ماذا تفعل لو ظهرت فروق

- لو الفرق في counts أساسية مثل العملاء أو الأصناف أو الفواتير: لا تستخدم Online Mode لهذا العميل قبل مراجعة التقرير.
- لو الفرق في totals مالية أكبر من 0.01: راجع الجداول التي ظهرت في warnings.
- لو فشل batch: التقرير يوضح `entityType` و`batchIndex` ورسالة الخطأ.
- لا تحذف SQLite المحلي. ارجع للـ Backup أو أعد الترحيل بعد حل السبب.

## النشر على Render

Build Command:

```bash
npm install && npm run build
```

Start Command:

```bash
npm start
```

Environment Variables على Render:

```text
NODE_ENV=production
JWT_SECRET=ضع_مفتاح_طويل
CONTROL_DATABASE_URL=ضع_رابط_Supabase_هنا
SYSTEM_ADMIN_USERNAME=admin
SYSTEM_ADMIN_PASSWORD=ضع_باسورد_قوي
```

لا تضف `PORT` في Render لأن Render يحدده تلقائيًا.

بعد أول نشر، شغل `npm run migrate` ثم `npm run seed` من Shell/Job آمن في Render أو محليًا بنفس متغيرات البيئة.

## ملاحظات أمان

- لا تضع رابط Supabase الحقيقي داخل Git.
- لا تضع كلمة مرور قاعدة البيانات داخل TypeScript.
- Electron لا يتصل مباشرة بـ Supabase.
- المسار الصحيح دائمًا:
  `Electron App -> Online API -> PostgreSQL`.

## Deploy to Vercel

1. Push the repository to GitHub.
2. In Vercel, import the GitHub repository.
3. If this repository contains the full YSale project, set the Vercel project root directory to `online-server`.
4. Add these Environment Variables in the Vercel dashboard:

```text
NODE_ENV=production
CONTROL_DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_long_secret
SYSTEM_ADMIN_USERNAME=admin
SYSTEM_ADMIN_PASSWORD=your_strong_password
```

5. Deploy the project. Vercel will use the default API Routes behavior from the `api/` folder.
6. Test the deployed health endpoint:

```text
https://your-project-name.vercel.app/api/health
```

Expected response: HTTP 200 with the health JSON payload, for example:

```json
{"ok":true,"service":"ysale-online-api","mode":"online-foundation","runtime":"vercel-api-route"}
```

Local commands stay unchanged:

```bash
npm run dev
npm run build
npm start
```

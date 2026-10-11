# LaosTravel — คู่มือเตรียม Staging สำหรับเจ้าของโครงการ

วันที่ตรวจ: 11 ตุลาคม 2026 — Shared Product Contract `2026-10-10.v2`

Staging คือระบบทดลองแยกจากระบบลูกค้าจริง ใช้บัญชี/ข้อมูลสังเคราะห์เท่านั้น เอกสารนี้เตรียมขั้นตอนให้เจ้าของกดเอง ยังไม่มีการสร้าง Supabase หรือ deploy Staging และไม่รับรอง Production readiness

## 1. สิ่งที่เจ้าของต้องกดเอง: บัญชีและค่าใช้จ่าย

1. เปิด https://supabase.com/dashboard และเข้าสู่บัญชีของเจ้าของ
2. เลือกหรือสร้าง Organization ที่ใช้ **Free plan** ตรวจหน้า Billing ว่าเป็น Free ก่อนกด New project หากหน้าจอต้องอัปเกรด/เพิ่มบริการเสียเงิน ให้หยุด
3. ตั้งชื่อ `laostravel-staging` เลือกภูมิภาคใกล้ผู้ใช้ตามตัวเลือกที่มี และบันทึก project reference ไว้แยกจาก Production
4. ตั้งรหัสฐานข้อมูลใหม่ใน password manager โดยเจ้าของเอง ไม่ส่งรหัสในแชต ไม่บันทึกลง Git
5. ตรวจตัวเลือกค่าใช้จ่ายก่อน Create project ไม่เปิด paid add-ons, compute upgrade, PITR หรือ dedicated IPv4
6. Free plan ณ วันที่ตรวจ: $0/เดือน, database 500 MB, storage 1 GB, จำกัด 2 active projects และอาจพักเมื่อไม่ใช้งาน 7 วัน ตรวจราคาบนหน้าจออีกครั้งก่อนสร้าง ไม่ซื้อ hosting/SMS/email เพิ่มอัตโนมัติ

งานโค้ดทำได้โดยไม่ต้องมีบัญชี ขั้นตอนนี้และ live acceptance เท่านั้นที่รอเจ้าของ

## 2. ปิดทางเข้าฐานข้อมูลโดยตรงก่อน bootstrap

Backend เดิมใช้ `pg` และเป็นผู้ตัดสิน business authorization ไม่ให้ Web/Mobile อ่านตารางธุรกิจผ่าน Supabase Data API โดยตรง

- ใน Project Settings → Data API ปิด Data API สำหรับ Staging หาก Dashboard มีตัวเลือกนี้ หรือเอา `public` ออกจาก exposed schemas ก่อนสร้างตาราง ตรวจ REST endpoint จริงภายหลัง
- ไม่เพิ่ม public/anon/authenticated policy ให้ตารางธุรกิจ และไม่เปิด Realtime ให้ข้อมูลบัญชี/booking/evidence
- ทำ client isolation ตามข้อ 4 แม้จะปิด Data API แล้ว เพราะ grants และ RLS เป็นคนละชั้น
- ไม่แก้ schema `auth`, `storage`, roles ภายในของ Supabase หรือ provider-managed functions

## 3. Auth และค่าที่ต้องตรงกัน

| ตำแหน่ง | ค่า Placeholder |
|---|---|
| Backend `AUTH_ISSUER_URL` | `https://<staging-project-ref>.supabase.co/auth/v1` |
| Backend `AUTH_AUDIENCE` | `authenticated` |
| Backend `AUTH_JWKS_URL` | `https://<staging-project-ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| Web `NEXT_PUBLIC_SUPABASE_URL` | `https://<staging-project-ref>.supabase.co` |
| Web `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `<staging-publishable-key>` |
| Mobile `LAOSTRAVEL_BACKEND_URL` | `https://<staging-backend-host>` |
| Mobile `LAOSTRAVEL_SUPABASE_URL` | URL ของ project เดียวกับ Backend/Web |
| Mobile `LAOSTRAVEL_SUPABASE_PUBLISHABLE_KEY` | publishable key ของ project เดียวกัน |

1. เปิดหน้า Authentication → Signing Keys **ตรวจอย่างเดียว** ว่ามี asymmetric key ES256 หรือ RS256 และ JWKS ตรง project นี้ ถ้าเป็น HS256 legacy ให้หยุดรายงาน incompatibility ห้ามหมุน/เปลี่ยน key ในงานนี้
2. ตั้ง Authentication → URL Configuration เป็น Staging Site URL และ exact redirect URLs ที่จำเป็น ห้าม wildcard ครอบคลุม Production
3. Website ปัจจุบันใช้ email/password REST session แบบ memory-only; ยังไม่มี SSR/PKCE callback implementation อย่าตั้ง callback แล้วสรุปว่าครบ recovery flow
4. Mobile ใช้ phone/SMS OTP; หากยังไม่มี SMS provider ให้คง login จริงเป็น Blocked ไม่ซื้อ SMS plan อัตโนมัติ พิจารณาบัญชีทดสอบ/OTP ทดสอบเฉพาะ Staging ตามการอนุมัติของเจ้าของ ห้ามปิดการยืนยันในโค้ด
5. Publishable key อยู่ใน client ได้ แต่ secret/service_role/JWT signing secret/database password ห้ามเข้า client หรือ `NEXT_PUBLIC_*`/dart-define

## 4. Bootstrap/Migration checklist

ใช้ `scripts/bootstrap-manifest.json` เป็นลำดับอ้างอิง: base schema ก่อน ตามด้วย **36 migration files** หมายเลข 0001–0034 มี 0025 และ 0027 อย่างละ 2 ไฟล์ ต้องรันครบทั้งคู่ ไม่ใช้เลข prefix เป็น migration identity

- ตรวจชื่อและ ref ของ Staging กับเจ้าของ และยืนยันว่า `public` ยังไม่มีตาราง LaosTravel/ข้อมูลจริง
- ตรวจ versions/checksums ใน `staging-migration-checklist.md`; migration SQL มี transaction ของตนเอง จึงไม่ห่อทั้งหมดด้วย transaction ที่คาดว่าจะ rollback ทุกไฟล์
- Connect panel → Session pooler (เหมาะกับ IPv4) หรือ direct connection ที่เครื่องเข้าถึงได้ ดาวน์โหลด CA จาก Database Settings → SSL configuration ใช้ `verify-full` และ certificate ที่เชื่อถือได้ ไม่ใช้ `rejectUnauthorized=false`
- เก็บ connection string ใน secret environment/password manager ของ Staging เท่านั้น ไม่พิมพ์ URL ที่มี password ใน log ใช้ libpq service/password file สิทธิ์ 0600 หรือ secure prompt เมื่อรัน psql
- รันแต่ละไฟล์ใน manifest ด้วย `psql -v ON_ERROR_STOP=1 -f <file>` บน Staging ที่ยืนยันแล้ว บันทึกไฟล์/เวลา/ผลโดยไม่บันทึกรหัส
- **ห้ามใช้ `scripts/run-db-bootstrap.mjs` กับ Supabase**: runner นี้ล็อกเฉพาะ local disposable `laostravel_test` และ `RUN_DB_BOOTSTRAP_TESTS=1` สำหรับ CI
- ถ้าล้มเหลว หยุดที่ไฟล์นั้น ตรวจ `schema_migrations` และ constraints ไม่ข้ามไฟล์ ไม่ rerun base schema ลงฐานที่มีตารางแล้ว ไม่สมมติว่าทุก migration rerunnable
- ก่อนเปิด Backend ให้ทำ hardening โดย session เดียวกัน: `SET laostravel.staging_isolation_approved='yes';` แล้ว `psql -v ON_ERROR_STOP=1 -f db/staging/client-isolation.sql` (ใช้ `-c` ตามด้วย `-f` ใน invocation เดียว หรือ SQL Editor session เดียว)
- สคริปต์นี้ใช้ allowlist 50 product tables เปิด RLS และ revoke table grants จาก PUBLIC/anon/authenticated รวม default table grants สำหรับผู้รัน migration เท่านั้น ไม่มีการสร้าง role หรือเปิด policy
- ตัวอย่าง invocation ที่ไม่ใส่ password ใน command (ต้องตั้ง secure libpq service โดยเจ้าของก่อน): `psql service=laostravel_staging -v ON_ERROR_STOP=1 -c "SET laostravel.staging_isolation_approved='yes'" -f db/staging/client-isolation.sql`
- ตรวจตารางทุกตัวว่ามี RLS และ client ไม่มี SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER; ไม่พึ่งแค่หน้าจอมีสัญลักษณ์ RLS
- ตรวจ defaults ของทุก role ที่อาจสร้างตารางเพิ่ม โดยเฉพาะ provider-managed default grants; scripts ไม่แก้ provider role/default ACL ให้เอง ต้องตรวจ hardening ซ้ำหลัง migration เพิ่ม

## 5. Database roles และ Internal User Provisioning

Backend เดิมต้องใช้ trusted server connection ที่เป็นเจ้าของตารางหรือมีสิทธิ์ bypass RLS อยู่แล้ว โดย Authorization ทุกคำขอเกิดที่ Backend ไม่มีการสร้างหรือเพิ่ม BYPASSRLS ในงานนี้ ห้ามใช้ `anon`/`authenticated` เป็น runtime connection หรือกรอก privileged connection ใน client

ตารางเจ้าของ bypass RLS ได้ตาม PostgreSQL ปกติ ไม่มี FORCE RLS เพราะ runtime ปัจจุบันไม่ได้ตั้ง per-request database JWT context หากใช้ non-owner role ที่ไม่มี bypass ให้หยุดเป็น Blocked ไม่แก้โดยเปิด client policy/GRANT กว้าง

ตรวจด้วย read-only SQL บน Staging:

```sql
SELECT current_user,current_database();
SELECT rolname,rolsuper,rolbypassrls,rolcanlogin FROM pg_roles
WHERE rolname IN(current_user,'anon','authenticated','service_role');
SELECT schemaname,tablename,tableowner,rowsecurity FROM pg_tables WHERE schemaname='public';
SELECT * FROM pg_policies WHERE schemaname IN('public','storage');
SELECT defaclrole::regrole,defaclnamespace::regnamespace,defaclobjtype,defaclacl FROM pg_default_acl;
```

Supabase `auth.users.id` **ไม่เท่ากับ** LaosTravel `users.id` โดยอัตโนมัติ เจ้าของ/ผู้ดูแลที่ได้รับสิทธิ์ต้อง provision บัญชีทดสอบผ่าน trusted administrative process เท่านั้น:

1. สร้าง provider test user แล้วตรวจ subject จาก provider โดยตรง
2. สร้าง/ระบุ internal user ACTIVE และ profile ตาม schema
3. ผูก `auth_identities(issuer,subject,user_id)` โดยใช้ issuer เต็มข้างต้น ตรวจ unique constraints และบันทึก audit ของการดำเนินการ
4. ไม่จับคู่ด้วย email ที่ client อ้าง ไม่ auto-create user จาก JWT และไม่ให้ ADMIN/PARTNER role เพียงเพราะมี JWT `role=authenticated`
5. `partner_members` และ `admin_role_assignments` จัดการแยกด้วยการอนุมัติที่เหมาะสม ไม่มีการเพิ่ม provisioning endpoint ในงานนี้
6. ทดสอบ unmapped subject และ SUSPENDED user ต้องถูกปฏิเสธ; outsider ไม่มีสิทธิ์ข้อมูล partner/booking

## 6. Private Evidence Storage — ยัง Blocked

เจ้าของเปิด Storage → New bucket ตั้งชื่อ Staging เท่านั้น และ **ปิด Public bucket** ใช้หลักฐานสังเคราะห์ ห้ามใส่ ID/passport/bank account จริงในรอบนี้

- ยังไม่มี upload API/provider adapter ใน Backend จึงคง `PARTNER_EVIDENCE_UPLOAD_APPROVED=false` แม้สร้าง bucket สำเร็จ ห้ามแสร้งว่า endpoint/bucket env แปลว่าจัดเก็บได้แล้ว
- ไม่เพิ่ม broad INSERT/SELECT policy ให้ authenticated ทั้งหมด ไม่อนุมานสิทธิ์จากชื่อ folder หรือ provider UID โดยไม่ mapping/ตรวจ owner
- ผู้ส่ง/partner/reviewer ต้องแยกสิทธิ์ตาม Backend owner/membership/admin authority; ต้องพิสูจน์ cross-partner deny, unauthenticated deny, public download deny และ reviewer authorization
- Signed URL เป็น bearer credential ต้องมี TTL และไม่ log URL; ต้องทดสอบหมดอายุ การลบ retention และ revoke access จริงก่อนเปิด gate
- Bucket private และ Storage RLS เป็นคนละเรื่องกับ product-table hardening ห้ามใช้ test ผ่านของ PostgreSQL มาแทนหลักฐาน Storage permissions
- ตรวจภายหลังบน provider: `SELECT id,public FROM storage.buckets;` และ policies ของ `storage.objects` ตรวจ grants ด้วย ไม่มีการรันหรือแก้ provider schema ในรอบนี้

## 7. เชื่อม hosting และตรวจรับหลังเจ้าของสร้าง Project

ยังไม่มี Staging host ที่ยืนยัน จึงไม่สร้าง/เปลี่ยน hosting หรือ Billing เอง ให้เลือก deployment แยกที่มีอยู่และรองรับ Next.js Node runtime/`pg`; ถ้าไม่มีต้องให้เจ้าของเลือกบริการและค่าใช้จ่ายก่อน

1. ตั้ง populated `.env.example` ใน **Staging environment เท่านั้น** Browser env ถูกฝังตอน build ต้อง rebuild เฉพาะ Staging เมื่อ public config เปลี่ยน
2. คง `BOOKING_API_APPROVED=false` และ evidence gate=false จนผ่าน live acceptance; hold minutes ต้องเป็นค่าที่อนุมัติ ไม่เดาแทนเจ้าของ
3. Web ใช้ same-origin `/api/v1`; `NEXT_PUBLIC_API_BASE_URL` ยังไม่ได้ใช้ใน connected client ต้องอยู่ host เดียวกับ Backend ไม่ตั้งเป็น remote API แล้วคาดว่าจะทำงาน
4. อย่าเปลี่ยน GitHub repo variables ของ Mobile เพื่อชี้ Staging ในงานนี้ ใช้ค่าของ test run ที่แยกภายหลัง และไม่สร้าง APK/AAB ในรอบนี้
5. ตรวจ shared-contract endpoint ยังเป็น `2026-10-10.v2`, readiness endpoint ยัง false ตาม blockers และ protected request ไม่มี token ต้อง fail closed
6. Live acceptance: valid JWT + mapped ACTIVE account, issuer/audience ผิด, revoked/suspended/unmapped account, Web email delivery/recovery, Mobile OTP, verified TLS DB connection, Data API denial และ private evidence access/expiry ต้องบันทึกผลแยก
7. จึงเสนอการเปิด **Staging booking gate** เมื่อมีหลักฐานครบ ส่วน Storage gate ยังปิดถ้าไม่มี adapter ไม่เปิด Production จากการผ่าน CI

## 8. หลักฐานรอบเตรียมและข้อจำกัด

- Website baseline `78eb2042e2e8e1eaae881c73d793242c36f07282`, PR #68 merged; Website CI run 38063679164 และ Database integration run 38063679166 success
- Mobile baseline `d1f9f5d07def26aa8a11947ff76ce945c349ad82`, PR #49 merged; CI run 38063717783 success (APK/AAB/upload steps skipped)
- ไม่มี open PR ของทั้งสอง repository ณ ตอนตรวจ
- รอบเตรียมเพิ่ม synthetic asymmetric-JWT tests, complete migration manifest, fail-closed bootstrap target guard และ disposable PostgreSQL client-isolation tests
- Passed ใน CI ไม่ใช่ผลเชื่อม Supabase จริง: provider Auth/delivery, TLS, roles จริง, Storage permissions และ device acceptance ยัง Not Tested/Blocked
- ไม่เปลี่ยน payment gateway, business rules, credentials, signing keys, billing, Production หรือ version contract

แหล่งอ้างอิงทางการ (ตรวจ 2026-10-11):
- https://supabase.com/pricing
- https://supabase.com/docs/guides/auth/signing-keys
- https://supabase.com/docs/guides/auth/jwt-fields
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://supabase.com/docs/guides/platform/ssl-enforcement
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/storage/security/access-control

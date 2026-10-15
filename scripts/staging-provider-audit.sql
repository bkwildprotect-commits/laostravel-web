-- Read-only. Run only on confirmed laostravel-staging after operator authorization.
BEGIN READ ONLY;
SELECT current_database(),current_user;
SELECT ssl,version,cipher FROM pg_stat_ssl WHERE pid=pg_backend_pid();
SELECT rolname,rolsuper,rolbypassrls,rolcanlogin FROM pg_roles
WHERE rolname IN(current_user,'anon','authenticated','service_role');
SELECT schemaname,tablename,tableowner,rowsecurity FROM pg_tables WHERE schemaname='public';
SELECT schemaname,tablename,policyname,roles,cmd FROM pg_policies WHERE schemaname IN('public','storage');
SELECT defaclrole::regrole,defaclnamespace::regnamespace,defaclobjtype,defaclacl FROM pg_default_acl;
-- These provider tables are intentionally not created or modified by product migrations.
SELECT id,public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='booking-evidence';
ROLLBACK;

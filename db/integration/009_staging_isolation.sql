-- Disposable CI fixture, never provider or Production database.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
GRANT USAGE ON SCHEMA public TO anon,authenticated;
-- Model provider defaults before applying client isolation.
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,authenticated;
SET laostravel.staging_isolation_approved='yes';
\i db/staging/client-isolation.sql
DO $$
DECLARE t record; r text;
BEGIN
 FOR t IN SELECT oid,relname,relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='r' LOOP
  IF NOT t.relrowsecurity THEN RAISE EXCEPTION 'RLS missing: %',t.relname; END IF;
  FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
   IF has_table_privilege(r,t.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN
    RAISE EXCEPTION 'Client privilege leaked: % %',r,t.relname;
   END IF;
  END LOOP;
 END LOOP;
END $$;
SET ROLE authenticated;
DO $$
BEGIN
 BEGIN
  PERFORM * FROM public.auth_identities;
  RAISE EXCEPTION 'Identity read unexpectedly allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  UPDATE public.bookings SET payment_status='PAID';
  RAISE EXCEPTION 'Payment mutation unexpectedly allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 BEGIN
  INSERT INTO public.admin_role_assignments(user_id,role) VALUES(gen_random_uuid(),'ADMIN');
  RAISE EXCEPTION 'Role escalation unexpectedly allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
RESET ROLE;
-- Subsequent mutation integration suite exercises owner access after hardening.
SELECT 'PASS: all product tables RLS-enabled; client privileges and escalation denied';

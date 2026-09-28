BEGIN;
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS preferred_display_currency char(3) NOT NULL DEFAULT 'LAK';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_user_profiles_display_currency') THEN
    ALTER TABLE user_profiles ADD CONSTRAINT ck_user_profiles_display_currency
      CHECK (preferred_display_currency IN ('LAK','KRW','JPY','THB','USD','CNY','EUR','VND'));
  END IF;
END $$;
INSERT INTO schema_migrations(version)
  VALUES ('0013_display_currency_preference') ON CONFLICT (version) DO NOTHING;
COMMIT;

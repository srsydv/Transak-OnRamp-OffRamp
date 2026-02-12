DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_rw') THEN
    CREATE ROLE app_rw LOGIN PASSWORD 'app_rw_password';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'job_rw') THEN
    CREATE ROLE job_rw LOGIN PASSWORD 'job_rw_password';
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'readonly') THEN
    CREATE ROLE readonly LOGIN PASSWORD 'readonly_password';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE payment_gateway TO app_rw, job_rw, readonly;
GRANT USAGE ON SCHEMA public TO app_rw, job_rw, readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rw, job_rw;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rw, job_rw;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;

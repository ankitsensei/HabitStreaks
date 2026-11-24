-- Accounts, looked up by email on every auth route (register, verify, resend,
-- login, and the Google find-or-create), all with the same predicate:
--
--   SELECT * FROM users WHERE email = $1
--
-- The routes assume that returns at most one row: login and verify read
-- rows[0], and register branches on existence before UPDATEing by email —
-- so with duplicates the app would silently act on an arbitrary row.
-- Uniqueness therefore belongs in the database, not just in the code.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  otp VARCHAR(6),
  otp_expires_at TIMESTAMP,
  auth0_sub TEXT
);

-- The unique btree index doubles as the lookup index for
-- `WHERE email = $1`, and rejects a second registration of an existing
-- address even if two requests race past the app's existence check.
--
-- Skipped when any unique index on email already exists: the deployed
-- database has UNIQUE (email) as the users_email_key constraint, and a
-- second identical index would only cost extra writes. Verify duplicates
-- first when adding this to an existing database:
--
--   SELECT email, count(*) FROM users GROUP BY email HAVING count(*) > 1;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'users'
      AND indexdef ~ 'CREATE UNIQUE INDEX .* \(email( DESC)?\)$'
  ) THEN
    CREATE UNIQUE INDEX users_email_idx ON users (email);
  END IF;
END
$$;

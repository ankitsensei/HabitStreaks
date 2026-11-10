-- Habits created by users.
CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,
  target_per_week SMALLINT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT habits_target_per_week_check
    CHECK (target_per_week BETWEEN 1 AND 7)
);

CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits (user_id);
CREATE INDEX IF NOT EXISTS habits_user_sort_order_idx ON habits (user_id, sort_order);

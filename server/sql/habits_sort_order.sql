-- Persist the user-defined display order of habits.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'habits'
      AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE habits
      ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

    -- Preserve the previous display order (newest first) as the initial order.
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY user_id
          ORDER BY created_at DESC, id DESC
        ) - 1 AS new_position
      FROM habits
    )
    UPDATE habits AS h
    SET sort_order = ranked.new_position
    FROM ranked
    WHERE h.id = ranked.id;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS habits_user_sort_order_idx
  ON habits (user_id, sort_order);

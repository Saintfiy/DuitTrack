ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS workspace_type TEXT NOT NULL DEFAULT 'business';

UPDATE businesses
SET workspace_type = 'business'
WHERE workspace_type IS NULL
   OR workspace_type NOT IN ('business', 'personal');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'businesses_workspace_type_check'
      AND conrelid = 'businesses'::regclass
  ) THEN
    ALTER TABLE businesses
      ADD CONSTRAINT businesses_workspace_type_check
      CHECK (workspace_type IN ('business', 'personal'));
  END IF;
END $$;

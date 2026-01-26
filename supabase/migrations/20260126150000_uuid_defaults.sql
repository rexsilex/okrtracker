-- Add UUID defaults to all tables
-- This ensures IDs are auto-generated when not provided

ALTER TABLE objectives ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE key_results ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE win_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE people ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

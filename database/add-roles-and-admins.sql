-- Add role column to users table
-- This migration adds support for user roles (admin, guest)

-- Step 1: Add the role column with a default value of 'guest'
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'guest';

-- Step 2: Add a check constraint to ensure only valid roles
ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('admin', 'guest'));

-- Step 3: Create an index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 4: Add the two admin phone numbers to invited_users if they don't exist
INSERT INTO invited_users (phone_number, name, invited_by)
VALUES
  ('6614879659', 'Admin 1', 'system'),
  ('95455057', 'Admin 2', 'system')
ON CONFLICT (phone_number) DO NOTHING;

-- Step 5: Create admin user accounts for the two phone numbers
-- First, insert them as users if they don't exist
INSERT INTO users (phone_number, name, role)
VALUES
  ('6614879659', 'Admin 1', 'admin'),
  ('95455057', 'Admin 2', 'admin')
ON CONFLICT (phone_number) DO UPDATE
SET role = 'admin';

-- Step 6: Create default RSVPs and activity signups for admin users
-- Get the user IDs for the admin users
DO $$
DECLARE
  admin1_id UUID;
  admin2_id UUID;
BEGIN
  -- Get admin user IDs
  SELECT id INTO admin1_id FROM users WHERE phone_number = '6614879659';
  SELECT id INTO admin2_id FROM users WHERE phone_number = '95455057';

  -- Create RSVPs if they don't exist
  IF admin1_id IS NOT NULL THEN
    INSERT INTO rsvps (user_id, attendance_status)
    VALUES (admin1_id, 'maybe')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO activity_signups (user_id, activity_type, participation_level)
    VALUES
      (admin1_id, 'shooting', 'not_attending'),
      (admin1_id, 'show', 'not_attending')
    ON CONFLICT (user_id, activity_type) DO NOTHING;
  END IF;

  IF admin2_id IS NOT NULL THEN
    INSERT INTO rsvps (user_id, attendance_status)
    VALUES (admin2_id, 'maybe')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO activity_signups (user_id, activity_type, participation_level)
    VALUES
      (admin2_id, 'shooting', 'not_attending'),
      (admin2_id, 'show', 'not_attending')
    ON CONFLICT (user_id, activity_type) DO NOTHING;
  END IF;
END $$;

-- Success message
SELECT
  'Migration completed successfully!' as message,
  COUNT(*) as admin_count
FROM users
WHERE role = 'admin';

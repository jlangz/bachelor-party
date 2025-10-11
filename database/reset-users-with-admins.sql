-- Reset users table and add the two admins
-- WARNING: This will delete all existing users and their data

-- ============================================
-- 1. DELETE ALL EXISTING DATA
-- ============================================

-- Delete related data first (foreign key constraints)
DELETE FROM activity_signups;
DELETE FROM rsvps;

-- Delete admin_passwords if it exists (may have been dropped already)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_passwords') THEN
    DELETE FROM admin_passwords;
  END IF;
END $$;

-- Delete all users
DELETE FROM users;

-- ============================================
-- 2. ADD THE TWO ADMIN USERS
-- ============================================

INSERT INTO users (phone_number, name, role, invited_by, title)
VALUES
  ('+4795455047', 'Markus G Kristensen', 'admin', 'system', 'Best Man'),
  ('+16614879659', 'Jakob Langseth', 'admin', 'system', 'Groom');

-- ============================================
-- 3. CREATE DEFAULT RSVPS AND ACTIVITY SIGNUPS
-- ============================================

-- Get the user IDs we just created
DO $$
DECLARE
  markus_id UUID;
  jakob_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO markus_id FROM users WHERE phone_number = '+4795455047';
  SELECT id INTO jakob_id FROM users WHERE phone_number = '+16614879659';

  -- Create default RSVPs for both admins
  INSERT INTO rsvps (user_id, attendance_status)
  VALUES
    (markus_id, 'maybe'),
    (jakob_id, 'maybe');

  -- Get all activities and create signups for both admins
  INSERT INTO activity_signups (user_id, activity_id, activity_type, participation_level)
  SELECT markus_id, id,
    CASE name
      WHEN 'Shooting Range' THEN 'shooting'
      WHEN 'Show/Entertainment' THEN 'show'
      ELSE 'other'
    END,
    'not_attending'
  FROM activities WHERE is_active = true;

  INSERT INTO activity_signups (user_id, activity_id, activity_type, participation_level)
  SELECT jakob_id, id,
    CASE name
      WHEN 'Shooting Range' THEN 'shooting'
      WHEN 'Show/Entertainment' THEN 'show'
      ELSE 'other'
    END,
    'not_attending'
  FROM activities WHERE is_active = true;
END $$;

-- ============================================
-- Success Message
-- ============================================
SELECT
  'Users table reset successfully!' as message,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count;

-- Display the admin users
SELECT
  name,
  phone_number,
  role,
  id
FROM users
WHERE role = 'admin'
ORDER BY name;

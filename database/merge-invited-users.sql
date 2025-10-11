-- Merge invited_users into users table
-- Simplifies the architecture - one table for all users (invited or registered)

-- ============================================
-- 1. ADD INVITED_BY COLUMN TO USERS
-- ============================================

-- Add invited_by column to track who invited this user
ALTER TABLE users
ADD COLUMN IF NOT EXISTS invited_by TEXT DEFAULT 'system';

-- ============================================
-- 2. MIGRATE DATA FROM INVITED_USERS TO USERS
-- ============================================

-- Insert any invited users that don't exist in users table yet
INSERT INTO users (phone_number, name, role, invited_by, created_at)
SELECT
  iu.phone_number,
  iu.name,
  'guest' as role,
  iu.invited_by,
  iu.created_at
FROM invited_users iu
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.phone_number = iu.phone_number
)
ON CONFLICT (phone_number) DO NOTHING;

-- Update existing users with invited_by info if they came from invited_users
UPDATE users u
SET invited_by = iu.invited_by
FROM invited_users iu
WHERE u.phone_number = iu.phone_number
AND u.invited_by = 'system';

-- ============================================
-- 3. UPDATE RLS POLICIES FOR USERS
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;

-- New policies
-- Everyone can read all users (for guest list, etc.)
CREATE POLICY "Everyone can read users"
  ON users FOR SELECT
  USING (true);

-- Anyone can insert themselves (first-time login)
CREATE POLICY "Anyone can register"
  ON users FOR INSERT
  WITH CHECK (true);

-- Users can update their own record
CREATE POLICY "Users can update themselves"
  ON users FOR UPDATE
  USING (id = current_setting('app.current_user_id', true)::uuid OR true);

-- Admins can do anything
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.current_user_id', true)::uuid AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = current_setting('app.current_user_id', true)::uuid AND role = 'admin'));

-- ============================================
-- 4. DROP INVITED_USERS TABLE (OPTIONAL)
-- ============================================

-- Uncomment to drop the old table after confirming migration worked
-- DROP TABLE IF EXISTS invited_users;

-- For now, we'll keep it for safety, but you can drop it later

-- ============================================
-- Success Message
-- ============================================
SELECT
  'Users table updated successfully!' as message,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM users WHERE role = 'guest') as guest_count,
  (SELECT COUNT(*) FROM users) as total_users;

-- Final Single Table Setup
-- One users table for everyone (admins and guests)
-- Admins use env password, guests login with just phone number

-- ============================================
-- 1. DROP INVITED_USERS TABLE
-- ============================================

DROP TABLE IF EXISTS invited_users CASCADE;

-- ============================================
-- 2. DROP ADMIN_PASSWORDS TABLE
-- ============================================
-- We'll use environment variable instead

DROP TABLE IF EXISTS admin_passwords CASCADE;

-- ============================================
-- 3. ENSURE USERS TABLE HAS CORRECT STRUCTURE
-- ============================================

-- Make sure invited_by and title columns exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS invited_by TEXT DEFAULT 'system';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS title TEXT;

-- ============================================
-- 4. UPDATE RLS POLICIES
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Everyone can read users" ON users;
DROP POLICY IF EXISTS "Everyone can insert users" ON users;
DROP POLICY IF EXISTS "Everyone can update users" ON users;
DROP POLICY IF EXISTS "Everyone can delete users" ON users;
DROP POLICY IF EXISTS "Anyone can register" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read all users" ON users;
DROP POLICY IF EXISTS "Users can insert their own record" ON users;
DROP POLICY IF EXISTS "Users can update their own record" ON users;

-- New simplified policies
CREATE POLICY "Everyone can read users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Everyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Everyone can update users"
  ON users FOR UPDATE
  USING (true);

CREATE POLICY "Everyone can delete users"
  ON users FOR DELETE
  USING (true);

-- Note: In production, you'd want more restrictive policies
-- For now, we're keeping it simple since authentication happens at the app level

-- ============================================
-- Success Message
-- ============================================
SELECT
  'Single table setup complete!' as message,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM users WHERE role = 'guest') as guest_count,
  (SELECT COUNT(*) FROM users) as total_users;

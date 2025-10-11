-- Admin Features Migration (Safe/Idempotent Version)
-- This migration adds:
-- 1. Admin password management
-- 2. Event information management
-- 3. Dynamic activities system
-- Can be run multiple times safely

-- ============================================
-- 1. ADMIN PASSWORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for admin_passwords
ALTER TABLE admin_passwords ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first, then recreate
DROP POLICY IF EXISTS "Admins can read their own password" ON admin_passwords;
CREATE POLICY "Admins can read their own password"
  ON admin_passwords FOR SELECT
  USING (user_id IN (SELECT id FROM users WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert their own password" ON admin_passwords;
CREATE POLICY "Admins can insert their own password"
  ON admin_passwords FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM users WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can update their own password" ON admin_passwords;
CREATE POLICY "Admins can update their own password"
  ON admin_passwords FOR UPDATE
  USING (user_id IN (SELECT id FROM users WHERE role = 'admin'));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_passwords_user_id ON admin_passwords(user_id);


-- ============================================
-- 2. EVENT INFORMATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS event_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL DEFAULT 'Bachelor Party',
  event_date_start DATE,
  event_date_end DATE,
  location_name TEXT,
  location_address TEXT,
  description TEXT,
  house_beds_total INTEGER DEFAULT 11,
  additional_info JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default event info only if table is empty
INSERT INTO event_info (
  event_name,
  event_date_start,
  event_date_end,
  location_name,
  description,
  house_beds_total
)
SELECT
  'Bachelor Party Weekend',
  NULL,
  NULL,
  'The House',
  'Join us for an epic bachelor party weekend!',
  11
WHERE NOT EXISTS (SELECT 1 FROM event_info);

-- RLS Policies for event_info
ALTER TABLE event_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read event info" ON event_info;
CREATE POLICY "Everyone can read event info"
  ON event_info FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can update event info" ON event_info;
CREATE POLICY "Admins can update event info"
  ON event_info FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = updated_by AND role = 'admin'));


-- ============================================
-- 3. DYNAMIC ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  activity_type TEXT CHECK (activity_type IN ('participatory', 'spectator', 'mixed')) DEFAULT 'participatory',
  participation_options JSONB DEFAULT '["participating", "watching", "not_attending"]',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Insert default activities only if they don't exist
INSERT INTO activities (name, description, activity_type, participation_options, display_order, is_active)
SELECT 'Shooting Range', 'Gun range activity - participate or watch', 'mixed', '["participating", "watching", "not_attending"]', 1, true
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Shooting Range');

INSERT INTO activities (name, description, activity_type, participation_options, display_order, is_active)
SELECT 'Show/Entertainment', 'Evening entertainment event', 'spectator', '["participating", "not_attending"]', 2, true
WHERE NOT EXISTS (SELECT 1 FROM activities WHERE name = 'Show/Entertainment');

-- RLS Policies for activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read active activities" ON activities;
CREATE POLICY "Everyone can read active activities"
  ON activities FOR SELECT
  USING (is_active = true OR EXISTS (SELECT 1 FROM users WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert activities" ON activities;
CREATE POLICY "Admins can insert activities"
  ON activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = created_by AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update activities" ON activities;
CREATE POLICY "Admins can update activities"
  ON activities FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE role = 'admin'));

DROP POLICY IF EXISTS "Admins can delete activities" ON activities;
CREATE POLICY "Admins can delete activities"
  ON activities FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE role = 'admin'));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activities_display_order ON activities(display_order);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active);


-- ============================================
-- 4. MIGRATE ACTIVITY SIGNUPS TO NEW SYSTEM
-- ============================================

-- Add new column to reference dynamic activities
ALTER TABLE activity_signups
ADD COLUMN IF NOT EXISTS activity_id UUID REFERENCES activities(id) ON DELETE CASCADE;

-- Migrate existing signups to reference new activities table
-- Map 'shooting' -> Shooting Range activity
-- Map 'show' -> Show/Entertainment activity
DO $$
DECLARE
  shooting_id UUID;
  show_id UUID;
BEGIN
  -- Get the IDs of the migrated activities
  SELECT id INTO shooting_id FROM activities WHERE name = 'Shooting Range';
  SELECT id INTO show_id FROM activities WHERE name = 'Show/Entertainment';

  -- Update existing signups only if they haven't been updated yet
  UPDATE activity_signups
  SET activity_id = shooting_id
  WHERE activity_type = 'shooting' AND activity_id IS NULL;

  UPDATE activity_signups
  SET activity_id = show_id
  WHERE activity_type = 'show' AND activity_id IS NULL;
END $$;

-- Note: Keep activity_type column for now for backward compatibility
-- In a future migration, we can drop it once all code is updated

-- Add index for new column
CREATE INDEX IF NOT EXISTS idx_activity_signups_activity_id ON activity_signups(activity_id);


-- ============================================
-- 5. INVITED USERS MANAGEMENT
-- ============================================

-- Add delete policy for invited_users (assuming it exists)
-- Allow admins to delete invited users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'invited_users') THEN
    ALTER TABLE invited_users ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist and recreate
    DROP POLICY IF EXISTS "Everyone can read invited users" ON invited_users;
    DROP POLICY IF EXISTS "Admins can manage invited users" ON invited_users;

    CREATE POLICY "Everyone can read invited users"
      ON invited_users FOR SELECT
      USING (true);

    CREATE POLICY "Admins can manage invited users"
      ON invited_users FOR ALL
      USING (EXISTS (SELECT 1 FROM users WHERE role = 'admin'))
      WITH CHECK (EXISTS (SELECT 1 FROM users WHERE role = 'admin'));
  END IF;
END $$;


-- ============================================
-- Success Message
-- ============================================
SELECT
  'Admin features migration completed successfully!' as message,
  (SELECT COUNT(*) FROM activities WHERE is_active = true) as active_activities,
  (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_users,
  (SELECT COUNT(*) FROM event_info) as event_info_records;

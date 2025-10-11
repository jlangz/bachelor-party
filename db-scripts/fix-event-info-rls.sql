-- Fix Event Info RLS Policies
-- Add permissive policies to allow reading and updating event info

-- ============================================
-- 1. DROP ANY EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "Everyone can read event info" ON event_info;
DROP POLICY IF EXISTS "Everyone can update event info" ON event_info;
DROP POLICY IF EXISTS "Admins can update event info" ON event_info;

-- ============================================
-- 2. CREATE PERMISSIVE POLICIES
-- ============================================

-- Allow everyone to read event info
CREATE POLICY "Everyone can read event info"
  ON event_info FOR SELECT
  USING (true);

-- Allow everyone to update event info (auth is handled at app level)
CREATE POLICY "Everyone can update event info"
  ON event_info FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow everyone to insert event info (for initial setup)
CREATE POLICY "Everyone can insert event info"
  ON event_info FOR INSERT
  WITH CHECK (true);

-- ============================================
-- Success Message
-- ============================================
SELECT
  'Event info RLS policies created!' as message,
  (SELECT COUNT(*) FROM event_info) as event_info_count;

-- Enhanced Event Info Fields Migration
-- Adds new fields for better event management

-- ============================================
-- 1. ADD NEW FIELDS TO EVENT_INFO TABLE
-- ============================================

ALTER TABLE event_info
ADD COLUMN IF NOT EXISTS short_description TEXT,
ADD COLUMN IF NOT EXISTS event_date_start_time TIME,
ADD COLUMN IF NOT EXISTS event_date_end_time TIME,
ADD COLUMN IF NOT EXISTS airbnb_house_name TEXT,
ADD COLUMN IF NOT EXISTS airbnb_address TEXT;

-- ============================================
-- 2. UPDATE DESCRIPTION TO BE RICH TEXT
-- ============================================
-- Note: rich_description already exists from previous migration
-- This ensures it's set up correctly

-- Update rich_description if it's still null or empty
UPDATE event_info
SET rich_description = '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Edit this description to add details about your bachelor party!"}]}]}'::jsonb
WHERE rich_description IS NULL
   OR rich_description::text = '{"type":"doc","content":[]}'
   OR rich_description::text = '{}';

-- ============================================
-- Success Message
-- ============================================
SELECT
  'Event info fields enhanced successfully!' as message,
  (SELECT COUNT(*) FROM event_info) as event_info_count;

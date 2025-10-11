-- Enhanced Activities and Event Info Migration
-- Adds rich fields to activities and event info tables

-- ============================================
-- 1. ENHANCE ACTIVITIES TABLE
-- ============================================

-- Add new fields to activities
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'trophy',
ADD COLUMN IF NOT EXISTS when_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS when_description TEXT,
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS cost_description TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Update existing activities with sample data
UPDATE activities
SET
  icon = 'target',
  when_description = 'Saturday Morning',
  location = 'Local Shooting Range',
  cost_description = '$50 per person (includes ammunition)'
WHERE name = 'Shooting Range' AND icon IS NULL OR icon = 'trophy';

UPDATE activities
SET
  icon = 'ticket',
  when_description = 'Saturday Evening',
  location = 'Comedy Club Downtown',
  cost_description = '$40 per person (includes 2 drinks)'
WHERE name = 'Show/Entertainment' AND icon IS NULL OR icon = 'trophy';


-- ============================================
-- 2. ENHANCE EVENT INFO TABLE
-- ============================================

-- Add rich content fields
ALTER TABLE event_info
ADD COLUMN IF NOT EXISTS rich_description JSONB DEFAULT '{"type":"doc","content":[]}',
ADD COLUMN IF NOT EXISTS schedule JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS important_info JSONB DEFAULT '[]';

-- Update existing event info with structured data
UPDATE event_info
SET
  schedule = '[
    {"time": "Friday 6:00 PM", "title": "Arrival & Check-in", "description": "Get settled in, grab a drink"},
    {"time": "Friday 8:00 PM", "title": "Welcome Dinner", "description": "Casual dinner and drinks"},
    {"time": "Saturday Morning", "title": "Activities", "description": "Choose your adventure"},
    {"time": "Saturday Evening", "title": "Entertainment", "description": "Night out on the town"},
    {"time": "Sunday Morning", "title": "Farewell Brunch", "description": "One last meal together"}
  ]'::jsonb,
  important_info = '[
    {"title": "What to Bring", "content": "Comfortable clothes, swimwear, party attitude"},
    {"title": "Check-in Time", "content": "Friday after 6 PM"},
    {"title": "Check-out Time", "content": "Sunday by 11 AM"},
    {"title": "House Rules", "content": "Respect the neighbors, clean up after yourself"}
  ]'::jsonb
WHERE schedule IS NULL OR schedule::text = '[]';


-- ============================================
-- Success Message
-- ============================================
SELECT
  'Activities and event info enhanced successfully!' as message,
  (SELECT COUNT(*) FROM activities) as total_activities,
  (SELECT COUNT(*) FROM event_info) as event_info_count;

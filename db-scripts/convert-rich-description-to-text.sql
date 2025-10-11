-- Convert rich_description from JSONB to TEXT
-- Store HTML from TipTap editor instead of JSON

-- ============================================
-- 1. ALTER COLUMN TYPE
-- ============================================

-- Convert rich_description to TEXT
ALTER TABLE event_info
ALTER COLUMN rich_description TYPE TEXT USING rich_description::text;

-- ============================================
-- 2. UPDATE EXISTING DATA
-- ============================================

-- If the column has JSON data like '{"type":"doc",...}', clear it
UPDATE event_info
SET rich_description = ''
WHERE rich_description LIKE '{%'
   OR rich_description = 'null'
   OR rich_description IS NULL;

-- ============================================
-- Success Message
-- ============================================
SELECT
  'Rich description converted to TEXT!' as message,
  (SELECT COUNT(*) FROM event_info) as event_info_count;

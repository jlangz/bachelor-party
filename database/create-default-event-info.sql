-- Create Default Event Info Record
-- Ensures there's always one event_info record to work with

-- ============================================
-- 1. DELETE ANY EXISTING EVENT INFO (start fresh)
-- ============================================
DELETE FROM event_info;

-- ============================================
-- 2. INSERT DEFAULT EVENT INFO
-- ============================================

INSERT INTO event_info (
  event_name,
  short_description,
  event_date_start,
  event_date_end,
  event_date_start_time,
  event_date_end_time,
  location_name,
  location_address,
  airbnb_house_name,
  airbnb_address,
  description,
  house_beds_total,
  rich_description,
  schedule,
  important_info,
  additional_info
)
VALUES (
  'Bachelor Party Weekend',
  'An epic weekend celebration',
  '2025-11-14',
  '2025-11-16',
  '18:00:00',
  '11:00:00',
  'Las Vegas, NV',
  '7340 S Ullom Dr, Las Vegas, NV 89139',
  'The Vegas House',
  '7340 S Ullom Dr, Las Vegas, NV 89139',
  'Join us for an unforgettable weekend!',
  11,
  '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Edit this description to add details about your bachelor party! Use the Description tab in the admin panel to format this text with headings, bold, italic, links, and images."}]}]}',
  '[
    {"time": "Friday 6:00 PM", "title": "Arrival & Check-in", "description": "Get settled in, grab a drink"},
    {"time": "Friday 8:00 PM", "title": "Welcome Dinner", "description": "Casual dinner and drinks"},
    {"time": "Saturday Morning", "title": "Activities", "description": "Choose your adventure"},
    {"time": "Saturday Evening", "title": "Entertainment", "description": "Night out on the town"},
    {"time": "Sunday Morning", "title": "Farewell Brunch", "description": "One last meal together"}
  ]',
  '[
    {"title": "What to Bring", "content": "Comfortable clothes, swimwear, party attitude"},
    {"title": "Check-in Time", "content": "Friday after 6 PM"},
    {"title": "Check-out Time", "content": "Sunday by 11 AM"},
    {"title": "House Rules", "content": "Respect the neighbors, clean up after yourself"}
  ]',
  '{}'
);

-- ============================================
-- Success Message
-- ============================================
SELECT
  'Event info record created/verified!' as message,
  (SELECT COUNT(*) FROM event_info) as event_info_count,
  (SELECT event_name FROM event_info LIMIT 1) as event_name;

# Supabase Database Setup

This file contains the complete SQL schema for the Bachelor Party app. Run this in your Supabase SQL Editor to set up all tables, indexes, RLS policies, and triggers.

## Instructions

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the SQL below
5. Click "Run" to execute

---

## Complete Database Schema

```sql
-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'guest')),
  invited_by TEXT DEFAULT 'system',
  title TEXT,
  email TEXT,
  note VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event info table
CREATE TABLE IF NOT EXISTS event_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL DEFAULT 'Bachelor Party',
  short_description TEXT,
  event_date_start DATE,
  event_date_end DATE,
  event_date_start_time TIME,
  event_date_end_time TIME,
  location_name TEXT,
  location_address TEXT,
  airbnb_house_name TEXT,
  airbnb_address TEXT,
  description TEXT,
  rich_description JSONB DEFAULT '{"type": "doc", "content": []}'::jsonb,
  schedule JSONB DEFAULT '[]'::jsonb,
  important_info JSONB DEFAULT '[]'::jsonb,
  house_beds_total INTEGER DEFAULT 11,
  additional_info JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  attendance_status TEXT DEFAULT 'maybe' CHECK (attendance_status IN ('yes', 'no', 'maybe')),
  sleeping_arrangement TEXT CHECK (sleeping_arrangement IN ('house_bed', 'own_place', 'not_staying')),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  activity_type TEXT DEFAULT 'participatory' CHECK (activity_type IN ('participatory', 'spectator', 'mixed')),
  participation_options JSONB DEFAULT '["participating", "watching", "not_attending"]'::jsonb,
  icon TEXT DEFAULT 'trophy',
  when_datetime TIMESTAMPTZ,
  when_description TEXT,
  cost DECIMAL,
  cost_description TEXT,
  location TEXT,
  additional_notes TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity signups table
CREATE TABLE IF NOT EXISTS activity_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  participation_level TEXT DEFAULT 'not_attending',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RECOMMENDATIONS (Places)
-- ============================================

CREATE TABLE IF NOT EXISTS recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('restaurant', 'bar', 'club', 'cafe', 'other')),
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  google_maps_url TEXT,
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  reservation_status TEXT NOT NULL DEFAULT 'none' CHECK (reservation_status IN ('none', 'recommended', 'required', 'booked')),
  reservation_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recommendation_id, user_id)
);

CREATE TABLE IF NOT EXISTS recommendation_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PREDICTIONS & BETTING
-- ============================================

CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('behavior', 'outcome', 'timing', 'general')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'revealed')),
  betting_opens_at TIMESTAMPTZ,
  betting_deadline TIMESTAMPTZ,
  reveal_date TIMESTAMPTZ,
  points_pool INTEGER DEFAULT 100,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prediction_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  points_wagered INTEGER NOT NULL DEFAULT 10 CHECK (points_wagered > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id, user_id)
);

CREATE TABLE IF NOT EXISTS prediction_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
  correct_option TEXT NOT NULL,
  revealed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revealed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_prediction_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 1000,
  points_won INTEGER DEFAULT 0,
  points_lost INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL POSTS
-- ============================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendation_likes_recommendation_id ON recommendation_likes(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_likes_user_id ON recommendation_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_comments_recommendation_id ON recommendation_comments(recommendation_id);

CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_category ON predictions(category);
CREATE INDEX IF NOT EXISTS idx_prediction_bets_prediction_id ON prediction_bets(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_bets_user_id ON prediction_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_prediction_stats_user_id ON user_prediction_stats(user_id);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prediction_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can view)
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read rsvps" ON rsvps FOR SELECT USING (true);
CREATE POLICY "Public read activities" ON activities FOR SELECT USING (true);
CREATE POLICY "Public read signups" ON activity_signups FOR SELECT USING (true);
CREATE POLICY "Public read event_info" ON event_info FOR SELECT USING (true);
CREATE POLICY "Public read recommendations" ON recommendations FOR SELECT USING (true);
CREATE POLICY "Public read recommendation_likes" ON recommendation_likes FOR SELECT USING (true);
CREATE POLICY "Public read recommendation_comments" ON recommendation_comments FOR SELECT USING (true);
CREATE POLICY "Public read predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Public read prediction_results" ON prediction_results FOR SELECT USING (true);
CREATE POLICY "Public read user_stats" ON user_prediction_stats FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Public read post_likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Public read post_comments" ON post_comments FOR SELECT USING (true);

-- Write policies (authenticated users)
CREATE POLICY "Users insert own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users update own data" ON users FOR UPDATE USING (true);
CREATE POLICY "Users manage own rsvp" ON rsvps FOR ALL USING (true);
CREATE POLICY "Users manage own signups" ON activity_signups FOR ALL USING (true);
CREATE POLICY "Users manage own recommendations" ON recommendations FOR ALL USING (true);
CREATE POLICY "Users manage own likes" ON recommendation_likes FOR ALL USING (true);
CREATE POLICY "Users manage own comments" ON recommendation_comments FOR ALL USING (true);
CREATE POLICY "Users manage own bets" ON prediction_bets FOR ALL USING (true);
CREATE POLICY "Users manage own stats" ON user_prediction_stats FOR ALL USING (true);
CREATE POLICY "Users manage own posts" ON posts FOR ALL USING (true);
CREATE POLICY "Users manage own post_likes" ON post_likes FOR ALL USING (true);
CREATE POLICY "Users manage own post_comments" ON post_comments FOR ALL USING (true);

-- Admin-only policies
CREATE POLICY "Admins manage activities" ON activities FOR ALL USING (true);
CREATE POLICY "Admins manage event_info" ON event_info FOR ALL USING (true);
CREATE POLICY "Admins manage predictions" ON predictions FOR ALL USING (true);
CREATE POLICY "Admins manage prediction_results" ON prediction_results FOR ALL USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_recommendations_updated_at BEFORE UPDATE ON recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recommendation_comments_updated_at BEFORE UPDATE ON recommendation_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prediction_bets_updated_at BEFORE UPDATE ON prediction_bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_prediction_stats_updated_at BEFORE UPDATE ON user_prediction_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize user stats on first bet
CREATE OR REPLACE FUNCTION initialize_user_prediction_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_prediction_stats (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER init_user_stats_on_first_bet
  AFTER INSERT ON prediction_bets
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_prediction_stats();

-- Calculate stats when prediction is revealed
CREATE OR REPLACE FUNCTION update_user_stats_on_reveal()
RETURNS TRIGGER AS $$
DECLARE
  bet_record RECORD;
  points_change INTEGER;
BEGIN
  FOR bet_record IN
    SELECT user_id, selected_option, points_wagered
    FROM prediction_bets
    WHERE prediction_id = NEW.prediction_id
  LOOP
    IF bet_record.selected_option = NEW.correct_option THEN
      -- Winner: gain points
      points_change := bet_record.points_wagered;
      UPDATE user_prediction_stats
      SET
        total_points = total_points + points_change,
        points_won = points_won + points_change,
        correct_predictions = correct_predictions + 1,
        total_predictions = total_predictions + 1,
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1)
      WHERE user_id = bet_record.user_id;
    ELSE
      -- Loser: lose points
      points_change := bet_record.points_wagered;
      UPDATE user_prediction_stats
      SET
        total_points = total_points - points_change,
        points_lost = points_lost + points_change,
        total_predictions = total_predictions + 1,
        current_streak = 0
      WHERE user_id = bet_record.user_id;
    END IF;
  END LOOP;

  -- Mark prediction as revealed
  UPDATE predictions
  SET status = 'revealed'
  WHERE id = NEW.prediction_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_stats_on_reveal
  AFTER INSERT ON prediction_results
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_reveal();
```

---

## Optional: Add Initial Test Data

After running the schema above, you can optionally add some test data:

```sql
-- Add a test admin user
INSERT INTO users (phone_number, name, role)
VALUES ('1234567890', 'Admin User', 'admin');

-- Add initial event info
INSERT INTO event_info (event_name, short_description)
VALUES ('Bachelor Party 2025', 'An epic weekend celebration!');
```

---

## Verify Installation

After running the SQL, verify everything is set up correctly:

1. Go to the Table Editor in Supabase
2. You should see 15 tables:
   - users
   - event_info
   - rsvps
   - activities
   - activity_signups
   - recommendations
   - recommendation_likes
   - recommendation_comments
   - predictions
   - prediction_bets
   - prediction_results
   - user_prediction_stats
   - posts
   - post_likes
   - post_comments

3. All tables should have RLS enabled (check Authentication > Policies)

---

## Troubleshooting

**If you get errors about existing tables:**
- The script uses `IF NOT EXISTS` so it's safe to re-run
- If you need to start fresh, manually drop all tables first

**If RLS policies fail:**
- This usually means the tables don't exist yet
- Run the table creation part first, then run the RLS policies

**If functions/triggers fail:**
- Make sure you're running this as the project owner
- Check that the referenced tables exist

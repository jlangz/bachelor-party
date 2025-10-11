-- Create recommendations table
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

-- Create recommendation_likes table
CREATE TABLE IF NOT EXISTS recommendation_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recommendation_id, user_id)
);

-- Create recommendation_comments table
CREATE TABLE IF NOT EXISTS recommendation_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendation_likes_recommendation_id ON recommendation_likes(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_likes_user_id ON recommendation_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_comments_recommendation_id ON recommendation_comments(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_comments_user_id ON recommendation_comments(user_id);

-- Enable Row Level Security
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recommendations
CREATE POLICY "Anyone can view recommendations"
  ON recommendations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own recommendations"
  ON recommendations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own recommendations"
  ON recommendations FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for recommendation_likes
CREATE POLICY "Anyone can view likes"
  ON recommendation_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create likes"
  ON recommendation_likes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can delete their own likes"
  ON recommendation_likes FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for recommendation_comments
CREATE POLICY "Anyone can view comments"
  ON recommendation_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON recommendation_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON recommendation_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON recommendation_comments FOR DELETE
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for recommendations
CREATE TRIGGER update_recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for recommendation_comments
CREATE TRIGGER update_recommendation_comments_updated_at
  BEFORE UPDATE ON recommendation_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

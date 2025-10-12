-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL, -- Array of option strings: ["Option 1", "Option 2", ...]
  category TEXT NOT NULL CHECK (category IN ('behavior', 'outcome', 'timing', 'general')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'revealed')),
  betting_deadline TIMESTAMPTZ,
  reveal_date TIMESTAMPTZ,
  points_pool INTEGER DEFAULT 100, -- Default points users can wager
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prediction_bets table
CREATE TABLE IF NOT EXISTS prediction_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL, -- The option text they selected
  points_wagered INTEGER NOT NULL DEFAULT 10 CHECK (points_wagered > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prediction_id, user_id) -- One bet per user per prediction
);

-- Create prediction_results table
CREATE TABLE IF NOT EXISTS prediction_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id UUID NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
  correct_option TEXT NOT NULL, -- The winning option
  revealed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  revealed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_prediction_stats table (aggregate stats per user)
CREATE TABLE IF NOT EXISTS user_prediction_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 1000, -- Starting points
  points_won INTEGER DEFAULT 0,
  points_lost INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  total_predictions INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status);
CREATE INDEX IF NOT EXISTS idx_predictions_category ON predictions(category);
CREATE INDEX IF NOT EXISTS idx_predictions_created_by ON predictions(created_by);
CREATE INDEX IF NOT EXISTS idx_prediction_bets_prediction_id ON prediction_bets(prediction_id);
CREATE INDEX IF NOT EXISTS idx_prediction_bets_user_id ON prediction_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_prediction_results_prediction_id ON prediction_results(prediction_id);
CREATE INDEX IF NOT EXISTS idx_user_prediction_stats_user_id ON user_prediction_stats(user_id);

-- Enable Row Level Security
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prediction_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for predictions
CREATE POLICY "Anyone can view predictions"
  ON predictions FOR SELECT
  USING (true);

CREATE POLICY "Admins can create predictions"
  ON predictions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update predictions"
  ON predictions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete predictions"
  ON predictions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for prediction_bets
CREATE POLICY "Anyone can view bets after prediction is revealed"
  ON prediction_bets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM predictions
      WHERE predictions.id = prediction_bets.prediction_id
      AND predictions.status = 'revealed'
    )
    OR prediction_bets.user_id = auth.uid()
  );

CREATE POLICY "Authenticated users can create bets"
  ON prediction_bets FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM predictions
      WHERE predictions.id = prediction_id
      AND predictions.status = 'open'
      AND (predictions.betting_deadline IS NULL OR predictions.betting_deadline > NOW())
    )
  );

CREATE POLICY "Users can update their own bets before deadline"
  ON prediction_bets FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM predictions
      WHERE predictions.id = prediction_id
      AND predictions.status = 'open'
      AND (predictions.betting_deadline IS NULL OR predictions.betting_deadline > NOW())
    )
  );

CREATE POLICY "Users can delete their own bets before deadline"
  ON prediction_bets FOR DELETE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM predictions
      WHERE predictions.id = prediction_id
      AND predictions.status = 'open'
      AND (predictions.betting_deadline IS NULL OR predictions.betting_deadline > NOW())
    )
  );

-- RLS Policies for prediction_results
CREATE POLICY "Anyone can view results"
  ON prediction_results FOR SELECT
  USING (true);

CREATE POLICY "Admins can create results"
  ON prediction_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update results"
  ON prediction_results FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- RLS Policies for user_prediction_stats
CREATE POLICY "Anyone can view stats"
  ON user_prediction_stats FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own stats"
  ON user_prediction_stats FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update stats"
  ON user_prediction_stats FOR UPDATE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_predictions_timestamp
  BEFORE UPDATE ON predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_predictions_updated_at();

CREATE TRIGGER update_prediction_bets_timestamp
  BEFORE UPDATE ON prediction_bets
  FOR EACH ROW
  EXECUTE FUNCTION update_predictions_updated_at();

CREATE TRIGGER update_user_prediction_stats_timestamp
  BEFORE UPDATE ON user_prediction_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_predictions_updated_at();

-- Function to initialize user stats when they make their first bet
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

-- Function to calculate and update user stats when a result is revealed
CREATE OR REPLACE FUNCTION update_user_stats_on_reveal()
RETURNS TRIGGER AS $$
DECLARE
  bet_record RECORD;
  points_change INTEGER;
BEGIN
  -- Loop through all bets for this prediction
  FOR bet_record IN
    SELECT user_id, selected_option, points_wagered
    FROM prediction_bets
    WHERE prediction_id = NEW.prediction_id
  LOOP
    -- Check if the bet was correct
    IF bet_record.selected_option = NEW.correct_option THEN
      -- Winner: gain points (2x their wager)
      points_change := bet_record.points_wagered;

      UPDATE user_prediction_stats
      SET
        total_points = total_points + points_change,
        points_won = points_won + points_change,
        correct_predictions = correct_predictions + 1,
        total_predictions = total_predictions + 1,
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        updated_at = NOW()
      WHERE user_id = bet_record.user_id;
    ELSE
      -- Loser: lose points
      points_change := bet_record.points_wagered;

      UPDATE user_prediction_stats
      SET
        total_points = total_points - points_change,
        points_lost = points_lost + points_change,
        total_predictions = total_predictions + 1,
        current_streak = 0,
        updated_at = NOW()
      WHERE user_id = bet_record.user_id;
    END IF;
  END LOOP;

  -- Update prediction status to revealed
  UPDATE predictions
  SET status = 'revealed', updated_at = NOW()
  WHERE id = NEW.prediction_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_stats_on_reveal
  AFTER INSERT ON prediction_results
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_on_reveal();

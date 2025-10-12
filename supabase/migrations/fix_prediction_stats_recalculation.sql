-- Migration: Fix prediction stats recalculation
-- This ensures that user stats are properly recalculated when bets or results are deleted/updated

-- Drop existing trigger and recreate it later with new logic
DROP TRIGGER IF EXISTS calculate_stats_on_reveal ON prediction_results;

-- Master function to recalculate all stats for a user from scratch
CREATE OR REPLACE FUNCTION recalculate_user_prediction_stats(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
  bet_record RECORD;
  base_points INTEGER := 1000;
  total_pts INTEGER := base_points;
  pts_won INTEGER := 0;
  pts_lost INTEGER := 0;
  correct_count INTEGER := 0;
  total_count INTEGER := 0;
  current_streak_count INTEGER := 0;
  longest_streak_count INTEGER := 0;
  temp_streak INTEGER := 0;
  is_correct BOOLEAN;
BEGIN
  -- Get all bets for this user on revealed predictions, ordered by reveal date
  -- This ensures we calculate streaks in chronological order
  FOR bet_record IN
    SELECT
      pb.selected_option,
      pb.points_wagered,
      pr.correct_option,
      pr.revealed_at
    FROM prediction_bets pb
    INNER JOIN prediction_results pr ON pb.prediction_id = pr.prediction_id
    WHERE pb.user_id = target_user_id
    ORDER BY pr.revealed_at ASC
  LOOP
    -- Increment total predictions
    total_count := total_count + 1;

    -- Check if bet was correct
    is_correct := (bet_record.selected_option = bet_record.correct_option);

    IF is_correct THEN
      -- Winner: gain points
      total_pts := total_pts + bet_record.points_wagered;
      pts_won := pts_won + bet_record.points_wagered;
      correct_count := correct_count + 1;

      -- Increment streak
      temp_streak := temp_streak + 1;
      longest_streak_count := GREATEST(longest_streak_count, temp_streak);
    ELSE
      -- Loser: lose points
      total_pts := total_pts - bet_record.points_wagered;
      pts_lost := pts_lost + bet_record.points_wagered;

      -- Reset streak
      temp_streak := 0;
    END IF;
  END LOOP;

  -- Current streak is the temp_streak (if it ended on wins, otherwise 0)
  current_streak_count := temp_streak;

  -- Upsert the stats (insert or update)
  INSERT INTO user_prediction_stats (
    user_id,
    total_points,
    points_won,
    points_lost,
    correct_predictions,
    total_predictions,
    current_streak,
    longest_streak,
    updated_at
  )
  VALUES (
    target_user_id,
    total_pts,
    pts_won,
    pts_lost,
    correct_count,
    total_count,
    current_streak_count,
    longest_streak_count,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = EXCLUDED.total_points,
    points_won = EXCLUDED.points_won,
    points_lost = EXCLUDED.points_lost,
    correct_predictions = EXCLUDED.correct_predictions,
    total_predictions = EXCLUDED.total_predictions,
    current_streak = EXCLUDED.current_streak,
    longest_streak = EXCLUDED.longest_streak,
    updated_at = EXCLUDED.updated_at;

END;
$$ LANGUAGE plpgsql;

-- Trigger function for when a bet is deleted
CREATE OR REPLACE FUNCTION handle_bet_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if the prediction has been revealed
  IF EXISTS (
    SELECT 1 FROM prediction_results
    WHERE prediction_id = OLD.prediction_id
  ) THEN
    PERFORM recalculate_user_prediction_stats(OLD.user_id);
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for when a bet is updated
CREATE OR REPLACE FUNCTION handle_bet_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only recalculate if the selected option changed and prediction has been revealed
  IF OLD.selected_option != NEW.selected_option AND EXISTS (
    SELECT 1 FROM prediction_results
    WHERE prediction_id = NEW.prediction_id
  ) THEN
    PERFORM recalculate_user_prediction_stats(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for when a result is deleted
CREATE OR REPLACE FUNCTION handle_result_delete()
RETURNS TRIGGER AS $$
DECLARE
  user_rec RECORD;
BEGIN
  -- Recalculate stats for all users who had bets on this prediction
  FOR user_rec IN
    SELECT DISTINCT user_id
    FROM prediction_bets
    WHERE prediction_id = OLD.prediction_id
  LOOP
    PERFORM recalculate_user_prediction_stats(user_rec.user_id);
  END LOOP;

  -- Set prediction status back to closed
  UPDATE predictions
  SET status = 'closed', updated_at = NOW()
  WHERE id = OLD.prediction_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for when a result is updated (correct option changed)
CREATE OR REPLACE FUNCTION handle_result_update()
RETURNS TRIGGER AS $$
DECLARE
  user_rec RECORD;
BEGIN
  -- Only recalculate if the correct option changed
  IF OLD.correct_option != NEW.correct_option THEN
    -- Recalculate stats for all users who had bets on this prediction
    FOR user_rec IN
      SELECT DISTINCT user_id
      FROM prediction_bets
      WHERE prediction_id = NEW.prediction_id
    LOOP
      PERFORM recalculate_user_prediction_stats(user_rec.user_id);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated trigger function for when a result is revealed (insert)
CREATE OR REPLACE FUNCTION handle_result_insert()
RETURNS TRIGGER AS $$
DECLARE
  user_rec RECORD;
BEGIN
  -- Recalculate stats for all users who bet on this prediction
  FOR user_rec IN
    SELECT DISTINCT user_id
    FROM prediction_bets
    WHERE prediction_id = NEW.prediction_id
  LOOP
    PERFORM recalculate_user_prediction_stats(user_rec.user_id);
  END LOOP;

  -- Update prediction status to revealed
  UPDATE predictions
  SET status = 'revealed', updated_at = NOW()
  WHERE id = NEW.prediction_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on prediction_bets
CREATE TRIGGER recalc_stats_on_bet_delete
  AFTER DELETE ON prediction_bets
  FOR EACH ROW
  EXECUTE FUNCTION handle_bet_delete();

CREATE TRIGGER recalc_stats_on_bet_update
  AFTER UPDATE ON prediction_bets
  FOR EACH ROW
  EXECUTE FUNCTION handle_bet_update();

-- Create triggers on prediction_results
CREATE TRIGGER recalc_stats_on_result_delete
  AFTER DELETE ON prediction_results
  FOR EACH ROW
  EXECUTE FUNCTION handle_result_delete();

CREATE TRIGGER recalc_stats_on_result_update
  AFTER UPDATE ON prediction_results
  FOR EACH ROW
  EXECUTE FUNCTION handle_result_update();

CREATE TRIGGER recalc_stats_on_result_insert
  AFTER INSERT ON prediction_results
  FOR EACH ROW
  EXECUTE FUNCTION handle_result_insert();

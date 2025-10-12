-- Add betting_opens_at column to predictions table
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS betting_opens_at TIMESTAMPTZ;

-- Add comment to explain the column
COMMENT ON COLUMN predictions.betting_opens_at IS 'The date/time when betting opens. Users cannot place bets before this time. If NULL, betting is open immediately.';

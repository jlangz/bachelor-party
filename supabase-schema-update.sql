-- Add this to your existing database (run in Supabase SQL Editor)
-- This adds the invited users table for pre-approval system

-- Invited users table
CREATE TABLE IF NOT EXISTS invited_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  invited_by TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invited_users_phone ON invited_users(phone_number);

-- Enable Row Level Security
ALTER TABLE invited_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Anyone can read invited users (needed for signup validation)
CREATE POLICY "Anyone can read invited users" ON invited_users FOR SELECT USING (true);

-- Only allow inserts/updates/deletes from authenticated sessions (we'll handle this in the API)
-- For now, allow all operations (you can make this more restrictive later)
CREATE POLICY "Anyone can insert invited users" ON invited_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update invited users" ON invited_users FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete invited users" ON invited_users FOR DELETE USING (true);

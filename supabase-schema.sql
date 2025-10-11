-- Bachelor Party Database Schema
-- Run this in your Supabase SQL Editor after creating your project

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RSVPs table
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  attendance_status TEXT CHECK (attendance_status IN ('yes', 'no', 'maybe')) DEFAULT 'maybe',
  sleeping_arrangement TEXT CHECK (sleeping_arrangement IN ('house_bed', 'own_place', 'not_staying')),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Activity signups table
CREATE TABLE activity_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('shooting', 'show')) NOT NULL,
  participation_level TEXT CHECK (participation_level IN ('participating', 'watching', 'not_attending')) DEFAULT 'not_attending',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, activity_type)
);

-- Create indexes for better query performance
CREATE INDEX idx_rsvps_user_id ON rsvps(user_id);
CREATE INDEX idx_activity_signups_user_id ON activity_signups(user_id);
CREATE INDEX idx_activity_signups_activity_type ON activity_signups(activity_type);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_signups ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all operations for now (since we're using simple phone auth)
-- In production, you'd want more restrictive policies

-- Users policies
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own record" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own record" ON users FOR UPDATE USING (true);

-- RSVPs policies
CREATE POLICY "Anyone can read RSVPs" ON rsvps FOR SELECT USING (true);
CREATE POLICY "Users can insert their own RSVP" ON rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own RSVP" ON rsvps FOR UPDATE USING (true);

-- Activity signups policies
CREATE POLICY "Anyone can read activity signups" ON activity_signups FOR SELECT USING (true);
CREATE POLICY "Users can insert their own signup" ON activity_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own signup" ON activity_signups FOR UPDATE USING (true);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only warn in development, not during build
if (typeof window !== 'undefined' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
  console.warn('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database
export type UserRole = 'admin' | 'guest';

export type User = {
  id: string;
  phone_number: string;
  name: string;
  role: UserRole;
  created_at: string;
};

export type AttendanceStatus = 'yes' | 'no' | 'maybe';
export type SleepingArrangement = 'house_bed' | 'own_place' | 'not_staying';

export type RSVP = {
  id: string;
  user_id: string;
  attendance_status: AttendanceStatus;
  sleeping_arrangement: SleepingArrangement | null;
  notes: string | null;
  updated_at: string;
};

export type ActivityType = 'shooting' | 'show';
export type ParticipationLevel = 'participating' | 'watching' | 'not_attending';

export type ActivitySignup = {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  participation_level: ParticipationLevel;
  updated_at: string;
};

export type InvitedUser = {
  id: string;
  phone_number: string;
  name: string;
  invited_by: string;
  created_at: string;
};

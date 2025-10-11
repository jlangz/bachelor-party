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
  invited_by: string;
  title?: string | null;
  email?: string | null;
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
  activity_type: ActivityType; // Kept for backward compatibility
  activity_id: string | null; // New: references activities table
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

export type AdminPassword = {
  id: string;
  user_id: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

export type ScheduleItem = {
  time: string;
  title: string;
  description: string;
};

export type ImportantInfoItem = {
  title: string;
  content: string;
};

export type EventInfo = {
  id: string;
  event_name: string;
  short_description: string | null;
  event_date_start: string | null;
  event_date_end: string | null;
  event_date_start_time: string | null;
  event_date_end_time: string | null;
  location_name: string | null;
  location_address: string | null;
  airbnb_house_name: string | null;
  airbnb_address: string | null;
  description: string | null;
  house_beds_total: number;
  additional_info: Record<string, any>;
  updated_at: string;
  updated_by: string | null;
  // Enhanced fields
  rich_description: any; // TipTap JSON
  schedule: ScheduleItem[];
  important_info: ImportantInfoItem[];
};

export type ActivityTypeCategory = 'participatory' | 'spectator' | 'mixed';

export type Activity = {
  id: string;
  name: string;
  description: string | null;
  activity_type: ActivityTypeCategory;
  participation_options: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Enhanced fields
  icon: string;
  when_datetime: string | null;
  when_description: string | null;
  cost: number | null;
  cost_description: string | null;
  location: string | null;
  additional_notes: string | null;
};

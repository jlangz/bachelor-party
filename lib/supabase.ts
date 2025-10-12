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
  note?: string | null;
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

export type ActivitySignup = {
  id: string;
  user_id: string;
  activity_id: string | null;
  participation_level: string; // Can be any custom value from activity.participation_options
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

export type ParticipationOption = {
  id: string;  // Use the text value as ID for backwards compatibility
  text: string;
};

export type Activity = {
  id: string;
  name: string;
  description: string | null;
  activity_type: ActivityTypeCategory;
  participation_options: ParticipationOption[];
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

// Recommendations types
export type RecommendationCategory = 'restaurant' | 'bar' | 'club' | 'cafe' | 'other';
export type PriceRange = '$' | '$$' | '$$$' | '$$$$';
export type ReservationStatus = 'none' | 'recommended' | 'required' | 'booked';

export type Recommendation = {
  id: string;
  user_id: string;
  name: string;
  category: RecommendationCategory;
  description: string | null;
  address: string;
  latitude: number;
  longitude: number;
  google_maps_url: string | null;
  price_range: PriceRange | null;
  reservation_status: ReservationStatus;
  reservation_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RecommendationLike = {
  id: string;
  recommendation_id: string;
  user_id: string;
  created_at: string;
};

export type RecommendationComment = {
  id: string;
  recommendation_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
};

// Extended types with relations
export type RecommendationWithUser = Recommendation & {
  user: Pick<User, 'id' | 'name'>;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
};

export type RecommendationCommentWithUser = RecommendationComment & {
  user: Pick<User, 'id' | 'name'>;
};

// Predictions types
export type PredictionCategory = 'behavior' | 'outcome' | 'timing' | 'general';
export type PredictionStatus = 'open' | 'closed' | 'revealed';

export type PredictionOption = {
  id: string;  // Unique UUID for each option
  text: string;
};

export type Prediction = {
  id: string;
  title: string;
  description: string | null;
  options: PredictionOption[];
  category: PredictionCategory;
  status: PredictionStatus;
  betting_opens_at: string | null;
  betting_deadline: string | null;
  reveal_date: string | null;
  points_pool: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PredictionBet = {
  id: string;
  prediction_id: string;
  user_id: string;
  selected_option: string;
  points_wagered: number;
  created_at: string;
  updated_at: string;
};

export type PredictionResult = {
  id: string;
  prediction_id: string;
  correct_option: string;
  revealed_by: string | null;
  revealed_at: string;
};

export type UserPredictionStats = {
  id: string;
  user_id: string;
  total_points: number;
  points_won: number;
  points_lost: number;
  correct_predictions: number;
  total_predictions: number;
  current_streak: number;
  longest_streak: number;
  updated_at: string;
};

// Extended types with relations
export type PredictionWithDetails = Prediction & {
  result?: PredictionResult;
  user_bet?: PredictionBet;
  total_bets: number;
  option_counts: Record<string, number>; // Count of bets per option
};

export type LeaderboardEntry = {
  user_id: string;
  user_name: string;
  total_points: number;
  correct_predictions: number;
  total_predictions: number;
  accuracy: number; // Percentage
  current_streak: number;
  longest_streak: number;
  rank: number;
};

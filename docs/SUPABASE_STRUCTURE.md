# SUPABASE STRUCTUR

## SCHEMA STRUCTURE

```sql
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  activity_type text DEFAULT 'participatory'::text CHECK (activity_type = ANY (ARRAY['participatory'::text, 'spectator'::text, 'mixed'::text])),
  participation_options jsonb DEFAULT '["participating", "watching", "not_attending"]'::jsonb,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  icon text DEFAULT 'trophy'::text,
  when_datetime timestamp with time zone,
  when_description text,
  cost numeric,
  cost_description text,
  location text,
  additional_notes text,
  CONSTRAINT activities_pkey PRIMARY KEY (id),
  CONSTRAINT activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.activity_signups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['shooting'::text, 'show'::text])),
  participation_level text DEFAULT 'not_attending'::text CHECK (participation_level = ANY (ARRAY['participating'::text, 'watching'::text, 'not_attending'::text])),
  updated_at timestamp with time zone DEFAULT now(),
  activity_id uuid,
  CONSTRAINT activity_signups_pkey PRIMARY KEY (id),
  CONSTRAINT activity_signups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT activity_signups_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id)
);
CREATE TABLE public.event_info (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_name text NOT NULL DEFAULT 'Bachelor Party'::text,
  event_date_start date,
  event_date_end date,
  location_name text,
  location_address text,
  description text,
  house_beds_total integer DEFAULT 11,
  additional_info jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  rich_description text DEFAULT '{"type": "doc", "content": []}'::jsonb,
  schedule jsonb DEFAULT '[]'::jsonb,
  important_info jsonb DEFAULT '[]'::jsonb,
  short_description text,
  event_date_start_time time without time zone,
  event_date_end_time time without time zone,
  airbnb_house_name text,
  airbnb_address text,
  CONSTRAINT event_info_pkey PRIMARY KEY (id),
  CONSTRAINT event_info_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);
CREATE TABLE public.prediction_bets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prediction_id uuid NOT NULL,
  user_id uuid NOT NULL,
  selected_option text NOT NULL,
  points_wagered integer NOT NULL DEFAULT 10 CHECK (points_wagered > 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prediction_bets_pkey PRIMARY KEY (id),
  CONSTRAINT prediction_bets_prediction_id_fkey FOREIGN KEY (prediction_id) REFERENCES public.predictions(id),
  CONSTRAINT prediction_bets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.prediction_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prediction_id uuid NOT NULL UNIQUE,
  correct_option text NOT NULL,
  revealed_by uuid,
  revealed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prediction_results_pkey PRIMARY KEY (id),
  CONSTRAINT prediction_results_prediction_id_fkey FOREIGN KEY (prediction_id) REFERENCES public.predictions(id),
  CONSTRAINT prediction_results_revealed_by_fkey FOREIGN KEY (revealed_by) REFERENCES public.users(id)
);
CREATE TABLE public.predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  options jsonb NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['behavior'::text, 'outcome'::text, 'timing'::text, 'general'::text])),
  status text NOT NULL DEFAULT 'open'::text CHECK (status = ANY (ARRAY['open'::text, 'closed'::text, 'revealed'::text])),
  betting_deadline timestamp with time zone,
  reveal_date timestamp with time zone,
  points_pool integer DEFAULT 100,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT predictions_pkey PRIMARY KEY (id),
  CONSTRAINT predictions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.recommendation_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recommendation_comments_pkey PRIMARY KEY (id),
  CONSTRAINT recommendation_comments_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.recommendations(id),
  CONSTRAINT recommendation_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.recommendation_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recommendation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recommendation_likes_pkey PRIMARY KEY (id),
  CONSTRAINT recommendation_likes_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.recommendations(id),
  CONSTRAINT recommendation_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['restaurant'::text, 'bar'::text, 'club'::text, 'cafe'::text, 'other'::text])),
  description text,
  address text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  google_maps_url text,
  price_range text CHECK (price_range = ANY (ARRAY['$'::text, '$$'::text, '$$$'::text, '$$$$'::text])),
  reservation_status text NOT NULL DEFAULT 'none'::text CHECK (reservation_status = ANY (ARRAY['none'::text, 'recommended'::text, 'required'::text, 'booked'::text])),
  reservation_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.rsvps (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  attendance_status text DEFAULT 'maybe'::text CHECK (attendance_status = ANY (ARRAY['yes'::text, 'no'::text, 'maybe'::text])),
  sleeping_arrangement text CHECK (sleeping_arrangement = ANY (ARRAY['house_bed'::text, 'own_place'::text, 'not_staying'::text])),
  notes text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rsvps_pkey PRIMARY KEY (id),
  CONSTRAINT rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_prediction_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_points integer DEFAULT 1000,
  points_won integer DEFAULT 0,
  points_lost integer DEFAULT 0,
  correct_predictions integer DEFAULT 0,
  total_predictions integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_prediction_stats_pkey PRIMARY KEY (id),
  CONSTRAINT user_prediction_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  phone_number text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  role text NOT NULL DEFAULT 'guest'::text CHECK (role = ANY (ARRAY['admin'::text, 'guest'::text])),
  invited_by text DEFAULT 'system'::text,
  title text,
  email text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
```

-- Fix RLS policies to match the pattern used in other tables
-- (Permissive policies that allow everyone, since we use custom auth)

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view recommendations" ON recommendations;
DROP POLICY IF EXISTS "Authenticated users can create recommendations" ON recommendations;
DROP POLICY IF EXISTS "Users can update their own recommendations" ON recommendations;
DROP POLICY IF EXISTS "Users can delete their own recommendations" ON recommendations;

DROP POLICY IF EXISTS "Anyone can view likes" ON recommendation_likes;
DROP POLICY IF EXISTS "Authenticated users can create likes" ON recommendation_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON recommendation_likes;

DROP POLICY IF EXISTS "Anyone can view comments" ON recommendation_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON recommendation_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON recommendation_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON recommendation_comments;

-- Create permissive policies matching the pattern used for users table
-- recommendations table
CREATE POLICY "Everyone can read recommendations"
  ON recommendations FOR SELECT
  USING (true);

CREATE POLICY "Everyone can insert recommendations"
  ON recommendations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Everyone can update recommendations"
  ON recommendations FOR UPDATE
  USING (true);

CREATE POLICY "Everyone can delete recommendations"
  ON recommendations FOR DELETE
  USING (true);

-- recommendation_likes table
CREATE POLICY "Everyone can read likes"
  ON recommendation_likes FOR SELECT
  USING (true);

CREATE POLICY "Everyone can insert likes"
  ON recommendation_likes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Everyone can update likes"
  ON recommendation_likes FOR UPDATE
  USING (true);

CREATE POLICY "Everyone can delete likes"
  ON recommendation_likes FOR DELETE
  USING (true);

-- recommendation_comments table
CREATE POLICY "Everyone can read comments"
  ON recommendation_comments FOR SELECT
  USING (true);

CREATE POLICY "Everyone can insert comments"
  ON recommendation_comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Everyone can update comments"
  ON recommendation_comments FOR UPDATE
  USING (true);

CREATE POLICY "Everyone can delete comments"
  ON recommendation_comments FOR DELETE
  USING (true);

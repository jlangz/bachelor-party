import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/recommendations - Get all recommendations with user info, likes count, and comments count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Fetch recommendations with user info
    const { data: recommendations, error: recsError } = await supabase
      .from('recommendations')
      .select(`
        *,
        user:users!recommendations_user_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false });

    if (recsError) {
      console.error('Error fetching recommendations:', recsError);
      return NextResponse.json(
        { error: 'Failed to fetch recommendations' },
        { status: 500 }
      );
    }

    // Get likes count for each recommendation
    const recommendationIds = recommendations?.map((r) => r.id) || [];

    const { data: likesData } = await supabase
      .from('recommendation_likes')
      .select('recommendation_id, user_id');

    // Get comments count for each recommendation
    const { data: commentsData } = await supabase
      .from('recommendation_comments')
      .select('recommendation_id');

    // Build counts map
    const likesCounts: Record<string, number> = {};
    const commentsCounts: Record<string, number> = {};
    const userLikes: Record<string, boolean> = {};

    likesData?.forEach((like) => {
      likesCounts[like.recommendation_id] = (likesCounts[like.recommendation_id] || 0) + 1;
      if (userId && like.user_id === userId) {
        userLikes[like.recommendation_id] = true;
      }
    });

    commentsData?.forEach((comment) => {
      commentsCounts[comment.recommendation_id] =
        (commentsCounts[comment.recommendation_id] || 0) + 1;
    });

    // Combine data
    const enrichedRecommendations = recommendations?.map((rec) => ({
      ...rec,
      likes_count: likesCounts[rec.id] || 0,
      comments_count: commentsCounts[rec.id] || 0,
      user_has_liked: userLikes[rec.id] || false,
    }));

    return NextResponse.json(enrichedRecommendations);
  } catch (error) {
    console.error('Error in GET /api/recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recommendations - Create a new recommendation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      name,
      category,
      description,
      address,
      latitude,
      longitude,
      google_maps_url,
      price_range,
      reservation_status,
      reservation_notes,
    } = body;

    // Validate required fields
    if (!user_id || !name || !category || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('recommendations')
      .insert({
        user_id,
        name,
        category,
        description: description || null,
        address,
        latitude,
        longitude,
        google_maps_url: google_maps_url || null,
        price_range: price_range || null,
        reservation_status: reservation_status || 'none',
        reservation_notes: reservation_notes || null,
      })
      .select(`
        *,
        user:users!recommendations_user_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating recommendation:', error);
      return NextResponse.json(
        { error: 'Failed to create recommendation' },
        { status: 500 }
      );
    }

    // Add counts to response
    const enrichedData = {
      ...data,
      likes_count: 0,
      comments_count: 0,
      user_has_liked: false,
    };

    return NextResponse.json(enrichedData, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

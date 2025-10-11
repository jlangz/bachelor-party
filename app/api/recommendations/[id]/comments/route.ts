import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/recommendations/[id]/comments - Get all comments for a recommendation
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabase
      .from('recommendation_comments')
      .select(`
        *,
        user:users!recommendation_comments_user_id_fkey(id, name)
      `)
      .eq('recommendation_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/recommendations/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/recommendations/[id]/comments - Create a new comment
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { user_id, comment } = body;

    if (!user_id || !comment?.trim()) {
      return NextResponse.json(
        { error: 'user_id and comment are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('recommendation_comments')
      .insert({
        recommendation_id: id,
        user_id,
        comment: comment.trim(),
      })
      .select(`
        *,
        user:users!recommendation_comments_user_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/recommendations/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

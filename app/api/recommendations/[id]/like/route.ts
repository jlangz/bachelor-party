import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/recommendations/[id]/like - Like a recommendation
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Check if already liked
    const { data: existing } = await supabase
      .from('recommendation_likes')
      .select('id')
      .eq('recommendation_id', id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already liked' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('recommendation_likes')
      .insert({
        recommendation_id: id,
        user_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating like:', error);
      return NextResponse.json(
        { error: 'Failed to like recommendation' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/recommendations/[id]/like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recommendations/[id]/like - Unlike a recommendation
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('recommendation_likes')
      .delete()
      .eq('recommendation_id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting like:', error);
      return NextResponse.json(
        { error: 'Failed to unlike recommendation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/recommendations/[id]/like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

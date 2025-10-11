import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/recommendations/[id] - Get a single recommendation
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { data, error } = await supabase
      .from('recommendations')
      .select(`
        *,
        user:users!recommendations_user_id_fkey(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching recommendation:', error);
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    // Get likes and comments count
    const { count: likesCount } = await supabase
      .from('recommendation_likes')
      .select('*', { count: 'exact', head: true })
      .eq('recommendation_id', id);

    const { count: commentsCount } = await supabase
      .from('recommendation_comments')
      .select('*', { count: 'exact', head: true })
      .eq('recommendation_id', id);

    const enrichedData = {
      ...data,
      likes_count: likesCount || 0,
      comments_count: commentsCount || 0,
    };

    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error('Error in GET /api/recommendations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/recommendations/[id] - Update a recommendation
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
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

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (google_maps_url !== undefined) updateData.google_maps_url = google_maps_url;
    if (price_range !== undefined) updateData.price_range = price_range;
    if (reservation_status !== undefined) updateData.reservation_status = reservation_status;
    if (reservation_notes !== undefined) updateData.reservation_notes = reservation_notes;

    const { data, error } = await supabase
      .from('recommendations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        user:users!recommendations_user_id_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Error updating recommendation:', error);
      return NextResponse.json(
        { error: 'Failed to update recommendation' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/recommendations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/recommendations/[id] - Delete a recommendation
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const { error } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recommendation:', error);
      return NextResponse.json(
        { error: 'Failed to delete recommendation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/recommendations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

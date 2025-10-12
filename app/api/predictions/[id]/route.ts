import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';

// GET single prediction with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('user_id');
    const userId = userIdCookie?.value;

    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', id)
      .single();

    if (predictionError || !prediction) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
    }

    // Get user's bet if logged in
    let userBet = null;
    if (userId) {
      const { data: betData } = await supabase
        .from('prediction_bets')
        .select('*')
        .eq('prediction_id', id)
        .eq('user_id', userId)
        .single();
      userBet = betData;
    }

    // Get result if revealed
    const { data: result } = await supabase
      .from('prediction_results')
      .select('*')
      .eq('prediction_id', id)
      .single();

    // Get bet counts
    const { data: betCounts } = await supabase
      .from('prediction_bets')
      .select('selected_option')
      .eq('prediction_id', id);

    const optionCounts: Record<string, number> = {};
    (betCounts || []).forEach((bet) => {
      optionCounts[bet.selected_option] = (optionCounts[bet.selected_option] || 0) + 1;
    });

    // Parse options if it's a string
    const options = typeof prediction.options === 'string'
      ? JSON.parse(prediction.options)
      : prediction.options;

    return NextResponse.json({
      ...prediction,
      options,
      user_bet: userBet,
      result: result || null,
      total_bets: betCounts?.length || 0,
      option_counts: optionCounts,
    });
  } catch (error) {
    console.error('Error in GET /api/predictions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a prediction (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }
    const updates: any = {};

    // Only update provided fields
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.options !== undefined) {
      // Convert string array to PredictionOption[] format
      const predictionOptions = body.options.map((text: string) => ({
        id: crypto.randomUUID(),
        text: text,
      }));
      updates.options = JSON.stringify(predictionOptions);
    }
    if (body.category !== undefined) updates.category = body.category;
    if (body.status !== undefined) updates.status = body.status;
    if (body.betting_deadline !== undefined) updates.betting_deadline = body.betting_deadline;
    if (body.reveal_date !== undefined) updates.reveal_date = body.reveal_date;
    if (body.points_pool !== undefined) updates.points_pool = body.points_pool;

    const { data: prediction, error: updateError } = await supabaseServer
      .from('predictions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating prediction:', updateError);
      return NextResponse.json({ error: 'Failed to update prediction' }, { status: 500 });
    }

    return NextResponse.json(prediction);
  } catch (error) {
    console.error('Error in PATCH /api/predictions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a prediction (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseServer
      .from('predictions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting prediction:', deleteError);
      return NextResponse.json({ error: 'Failed to delete prediction' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/predictions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

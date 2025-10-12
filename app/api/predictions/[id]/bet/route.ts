import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';

// POST - Place or update a bet on a prediction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: predictionId } = await params;
    const body = await request.json();
    const { userId, selected_option, points_wagered } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
    }

    // Validate input
    if (!selected_option || !points_wagered || points_wagered <= 0) {
      return NextResponse.json(
        { error: 'Invalid data: selected_option and positive points_wagered required' },
        { status: 400 }
      );
    }

    // Check if prediction exists and is open
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (predictionError || !prediction) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
    }

    if (prediction.status !== 'open') {
      return NextResponse.json(
        { error: 'Betting is closed for this prediction' },
        { status: 400 }
      );
    }

    // Check if betting has opened yet
    if (prediction.betting_opens_at) {
      const opensAt = new Date(prediction.betting_opens_at);
      if (opensAt > new Date()) {
        return NextResponse.json(
          { error: 'Betting has not opened yet' },
          { status: 400 }
        );
      }
    }

    // Check if betting deadline has passed
    if (prediction.betting_deadline) {
      const deadline = new Date(prediction.betting_deadline);
      if (deadline < new Date()) {
        return NextResponse.json(
          { error: 'Betting deadline has passed' },
          { status: 400 }
        );
      }
    }

    // Validate selected option exists in prediction options
    const options = typeof prediction.options === 'string'
      ? JSON.parse(prediction.options)
      : prediction.options;

    // Check if the selected option ID exists in the options array
    const validOption = options.find((opt: any) => opt.id === selected_option);
    if (!validOption) {
      return NextResponse.json(
        { error: 'Invalid option selected' },
        { status: 400 }
      );
    }

    // Check user's current stats to ensure they have enough points
    const { data: userStats } = await supabase
      .from('user_prediction_stats')
      .select('total_points')
      .eq('user_id', userId)
      .single();

    // If user doesn't have stats yet, they get default 1000 points
    const availablePoints = userStats?.total_points || 1000;

    if (points_wagered > availablePoints) {
      return NextResponse.json(
        { error: `Insufficient points. You have ${availablePoints} points available.` },
        { status: 400 }
      );
    }

    // Check if user already has a bet (use service role to bypass RLS)
    const { data: existingBet } = await supabaseServer
      .from('prediction_bets')
      .select('*')
      .eq('prediction_id', predictionId)
      .eq('user_id', userId)
      .single();

    let bet;
    if (existingBet) {
      // Update existing bet using service role client (bypasses RLS)
      const { data: updatedBet, error: updateError } = await supabaseServer
        .from('prediction_bets')
        .update({
          selected_option,
          points_wagered,
        })
        .eq('id', existingBet.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating bet:', updateError);
        return NextResponse.json({ error: 'Failed to update bet' }, { status: 500 });
      }
      bet = updatedBet;
    } else {
      // Create new bet using service role client (bypasses RLS)
      const { data: newBet, error: insertError } = await supabaseServer
        .from('prediction_bets')
        .insert({
          prediction_id: predictionId,
          user_id: userId,
          selected_option,
          points_wagered,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating bet:', insertError);
        return NextResponse.json({ error: 'Failed to place bet' }, { status: 500 });
      }
      bet = newBet;
    }

    return NextResponse.json({ success: true, bet }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/predictions/[id]/bet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a bet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: predictionId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - User ID required' }, { status: 401 });
    }

    // Check if prediction is still open
    const { data: prediction } = await supabase
      .from('predictions')
      .select('status, betting_deadline')
      .eq('id', predictionId)
      .single();

    if (!prediction || prediction.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot remove bet - betting is closed' },
        { status: 400 }
      );
    }

    // Delete the bet using service role client (bypasses RLS)
    const { error: deleteError } = await supabaseServer
      .from('prediction_bets')
      .delete()
      .eq('prediction_id', predictionId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting bet:', deleteError);
      return NextResponse.json({ error: 'Failed to delete bet' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/predictions/[id]/bet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

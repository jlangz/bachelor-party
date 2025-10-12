import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';

// GET all predictions with user's bets and results
export async function GET(request: NextRequest) {
  try {
    // Get userId from query params (optional)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get all predictions
    const { data: predictions, error: predictionsError } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (predictionsError) {
      console.error('Error fetching predictions:', predictionsError);
      return NextResponse.json({ error: 'Failed to fetch predictions' }, { status: 500 });
    }

    // Get all bets for this user
    let userBets: any[] = [];
    if (userId) {
      const { data: betsData } = await supabaseServer
        .from('prediction_bets')
        .select('*')
        .eq('user_id', userId);
      userBets = betsData || [];
    }

    // Get all results for revealed predictions
    const { data: results } = await supabase
      .from('prediction_results')
      .select('*');

    // Get bet counts per prediction (use service role to bypass RLS)
    const { data: betCounts } = await supabaseServer
      .from('prediction_bets')
      .select('prediction_id, selected_option');

    // Aggregate bet counts by prediction and option
    const betCountsByPrediction: Record<string, { total: number; options: Record<string, number> }> = {};
    (betCounts || []).forEach((bet) => {
      if (!betCountsByPrediction[bet.prediction_id]) {
        betCountsByPrediction[bet.prediction_id] = { total: 0, options: {} };
      }
      betCountsByPrediction[bet.prediction_id].total++;
      betCountsByPrediction[bet.prediction_id].options[bet.selected_option] =
        (betCountsByPrediction[bet.prediction_id].options[bet.selected_option] || 0) + 1;
    });

    // Combine data
    const predictionsWithDetails = predictions.map((prediction) => {
      const userBet = userBets.find((bet) => bet.prediction_id === prediction.id);
      const result = (results || []).find((r) => r.prediction_id === prediction.id);
      const betStats = betCountsByPrediction[prediction.id] || { total: 0, options: {} };

      // Parse options if it's a string
      const options = typeof prediction.options === 'string'
        ? JSON.parse(prediction.options)
        : prediction.options;

      return {
        ...prediction,
        options,
        user_bet: userBet || null,
        result: result || null,
        total_bets: betStats.total,
        option_counts: betStats.options,
      };
    });

    return NextResponse.json(predictionsWithDetails);
  } catch (error) {
    console.error('Error in GET /api/predictions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new prediction (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      description,
      options,
      category,
      betting_opens_at,
      betting_deadline,
      reveal_date,
      points_pool,
    } = body;

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

    // Validate required fields
    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'Invalid data: title and at least 2 options required' },
        { status: 400 }
      );
    }

    // Convert string array to PredictionOption[] format
    const predictionOptions = options.map((text: string) => ({
      id: crypto.randomUUID(),
      text: text,
    }));

    // Insert prediction using service role client (bypasses RLS)
    const { data: prediction, error: insertError } = await supabaseServer
      .from('predictions')
      .insert({
        title,
        description: description || null,
        options: JSON.stringify(predictionOptions),
        category: category || 'general',
        betting_opens_at: betting_opens_at || null,
        betting_deadline: betting_deadline || null,
        reveal_date: reveal_date || null,
        points_pool: points_pool || 100,
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating prediction:', insertError);
      return NextResponse.json({ error: 'Failed to create prediction' }, { status: 500 });
    }

    return NextResponse.json(prediction, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/predictions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

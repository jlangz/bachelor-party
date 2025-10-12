import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';

// POST - Reveal the result of a prediction (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: predictionId } = await params;
    const body = await request.json();
    const { userId, correct_option } = body;

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

    if (!correct_option) {
      return NextResponse.json(
        { error: 'correct_option is required' },
        { status: 400 }
      );
    }

    // Check if prediction exists
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (predictionError || !prediction) {
      return NextResponse.json({ error: 'Prediction not found' }, { status: 404 });
    }

    // Validate correct_option exists in prediction options
    const options = typeof prediction.options === 'string'
      ? JSON.parse(prediction.options)
      : prediction.options;

    // Check if the correct option ID exists in the options array
    const validOption = options.find((opt: any) => opt.id === correct_option);
    if (!validOption) {
      return NextResponse.json(
        { error: 'Invalid option - not in prediction options' },
        { status: 400 }
      );
    }

    // Check if result already exists
    const { data: existingResult } = await supabase
      .from('prediction_results')
      .select('*')
      .eq('prediction_id', predictionId)
      .single();

    if (existingResult) {
      // Update existing result
      const { data: result, error: updateError } = await supabaseServer
        .from('prediction_results')
        .update({
          correct_option,
          revealed_by: userId,
          revealed_at: new Date().toISOString(),
        })
        .eq('prediction_id', predictionId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating result:', updateError);
        return NextResponse.json({ error: 'Failed to update result' }, { status: 500 });
      }

      return NextResponse.json({ success: true, result });
    } else {
      // Create new result (this will trigger the database function to calculate stats)
      const { data: result, error: insertError } = await supabaseServer
        .from('prediction_results')
        .insert({
          prediction_id: predictionId,
          correct_option,
          revealed_by: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating result:', insertError);
        return NextResponse.json({ error: 'Failed to reveal result' }, { status: 500 });
      }

      return NextResponse.json({ success: true, result }, { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/predictions/[id]/reveal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

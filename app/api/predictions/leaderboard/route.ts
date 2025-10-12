import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get all user stats with user information
    const { data: stats, error: statsError } = await supabase
      .from('user_prediction_stats')
      .select(`
        *,
        users:user_id (
          id,
          name
        )
      `)
      .order('total_points', { ascending: false });

    if (statsError) {
      console.error('Error fetching leaderboard:', statsError);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Format and add rank
    const leaderboard = (stats || []).map((stat: any, index: number) => {
      const accuracy = stat.total_predictions > 0
        ? Math.round((stat.correct_predictions / stat.total_predictions) * 100)
        : 0;

      return {
        user_id: stat.user_id,
        user_name: stat.users?.name || 'Unknown',
        total_points: stat.total_points,
        correct_predictions: stat.correct_predictions,
        total_predictions: stat.total_predictions,
        accuracy,
        current_streak: stat.current_streak,
        longest_streak: stat.longest_streak,
        points_won: stat.points_won,
        points_lost: stat.points_lost,
        rank: index + 1,
      };
    });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error in GET /api/predictions/leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

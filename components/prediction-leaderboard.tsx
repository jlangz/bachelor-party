'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeaderboardEntry } from '@/lib/supabase';
import { Trophy, Target, Flame, Award } from 'lucide-react';
import { toast } from 'sonner';

type PredictionLeaderboardProps = {
  currentUserId?: string;
};

export function PredictionLeaderboard({ currentUserId }: PredictionLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/predictions/leaderboard');
      if (!response.ok) {
        throw new Error('Failed to load leaderboard');
      }
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-6 h-6 text-amber-700" />;
    return null;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-700';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Leaderboard
          </CardTitle>
          <CardDescription>
            No predictions have been resolved yet. Make your bets and check back after results are revealed!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Leaderboard
        </CardTitle>
        <CardDescription>
          Rankings based on total points earned from correct predictions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isCurrentUser = entry.user_id === currentUserId;

            return (
              <div
                key={entry.user_id}
                className={`p-4 rounded-lg border transition-colors ${
                  isCurrentUser
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(entry.rank) || (
                      <span className={`text-2xl font-bold ${getRankColor(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">
                        {entry.user_name}
                      </h3>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-primary">You</Badge>
                      )}
                      {entry.current_streak >= 3 && (
                        <Badge className="bg-orange-500/20 text-orange-400">
                          <Flame className="w-3 h-3 mr-1" />
                          {entry.current_streak} streak
                        </Badge>
                      )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 text-sm mt-2">
                      <div>
                        <p className="text-muted-foreground text-xs">Points</p>
                        <p className="font-bold text-primary text-lg">
                          {entry.total_points.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Accuracy
                        </p>
                        <p className="font-semibold">
                          {entry.accuracy}%
                          <span className="text-xs text-muted-foreground ml-1">
                            ({entry.correct_predictions}/{entry.total_predictions})
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          Best Streak
                        </p>
                        <p className="font-semibold">{entry.longest_streak}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        {currentUserId && (
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Your Rank</p>
                <p className="text-2xl font-bold text-primary">
                  {leaderboard.find((e) => e.user_id === currentUserId)?.rank || '-'}
                  <span className="text-sm text-muted-foreground ml-1">
                    / {leaderboard.length}
                  </span>
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Points to #1</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {leaderboard[0] && currentUserId
                    ? Math.max(
                        0,
                        leaderboard[0].total_points -
                          (leaderboard.find((e) => e.user_id === currentUserId)
                            ?.total_points || 0)
                      ).toLocaleString()
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { PredictionCard } from '@/components/prediction-card';
import { PredictionLeaderboard } from '@/components/prediction-leaderboard';
import { PredictionResults } from '@/components/prediction-results';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PredictionWithDetails, UserPredictionStats } from '@/lib/supabase';
import { Trophy, TrendingUp, Target, Flame } from 'lucide-react';
import { toast } from 'sonner';

export default function PredictionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [predictions, setPredictions] = useState<PredictionWithDetails[]>([]);
  const [userStats, setUserStats] = useState<UserPredictionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load predictions (pass userId to get user-specific bet data)
      const predictionsResponse = await fetch(`/api/predictions?userId=${user?.id || ''}`);
      if (!predictionsResponse.ok) throw new Error('Failed to load predictions');
      const predictionsData = await predictionsResponse.json();
      setPredictions(predictionsData);

      // Load user stats
      if (user) {
        const statsResponse = await fetch('/api/predictions/leaderboard');
        if (statsResponse.ok) {
          const leaderboard = await statsResponse.json();
          const myStats = leaderboard.find((entry: any) => entry.user_id === user.id);
          if (myStats) {
            setUserStats({
              id: '',
              user_id: myStats.user_id,
              total_points: myStats.total_points,
              points_won: myStats.points_won || 0,
              points_lost: myStats.points_lost || 0,
              correct_predictions: myStats.correct_predictions,
              total_predictions: myStats.total_predictions,
              current_streak: myStats.current_streak,
              longest_streak: myStats.longest_streak,
              updated_at: '',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const openPredictions = predictions.filter((p) => {
    const deadlinePassed = p.betting_deadline
      ? new Date(p.betting_deadline) < new Date()
      : false;
    return p.status === 'open' && !deadlinePassed;
  });

  const myBets = predictions.filter((p) => p.user_bet);
  const revealedPredictions = predictions.filter((p) => p.status === 'revealed');

  const availablePoints = userStats?.total_points || 1000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            Betting Pool
          </h1>
          <p className="text-muted-foreground text-lg">
            What will happen at the bachelor party? Place your bets and compete for the top spot!
          </p>
        </div>

        {/* User Stats Summary */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Available Points</p>
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">
              {availablePoints.toLocaleString()}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <Target className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold">
              {userStats && userStats.total_predictions > 0
                ? Math.round(
                    (userStats.correct_predictions / userStats.total_predictions) * 100
                  )
                : 0}
              %
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {userStats?.correct_predictions || 0} / {userStats?.total_predictions || 0} correct
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-orange-500">
              {userStats?.current_streak || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Best: {userStats?.longest_streak || 0}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Active Bets</p>
              <Trophy className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-500">{myBets.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {openPredictions.length} open
            </p>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="active">
              Active
              {openPredictions.length > 0 && (
                <Badge className="ml-2 bg-blue-500">{openPredictions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mybets">
              My Bets
              {myBets.length > 0 && (
                <Badge className="ml-2 bg-primary">{myBets.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="results">
              Results
              {revealedPredictions.length > 0 && (
                <Badge className="ml-2 bg-green-500">{revealedPredictions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Active Predictions */}
          <TabsContent value="active" className="space-y-6">
            {openPredictions.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold mb-2">No Active Predictions</p>
                <p className="text-muted-foreground">
                  Check back later for new predictions to bet on!
                </p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Place your bets on these open predictions before the deadline!
                </p>
                {openPredictions.map((prediction) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    userId={user.id}
                    onBetPlaced={loadData}
                    userPoints={availablePoints}
                  />
                ))}
              </>
            )}
          </TabsContent>

          {/* My Bets */}
          <TabsContent value="mybets" className="space-y-6">
            {myBets.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold mb-2">No Bets Placed Yet</p>
                <p className="text-muted-foreground">
                  Head to the Active tab to make your first prediction!
                </p>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">
                  All predictions you've placed bets on ({myBets.length} total)
                </p>
                {myBets.map((prediction) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    userId={user.id}
                    onBetPlaced={loadData}
                    userPoints={availablePoints}
                  />
                ))}
              </>
            )}
          </TabsContent>

          {/* Results */}
          <TabsContent value="results">
            <PredictionResults predictions={predictions} currentUserId={user.id} />
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <PredictionLeaderboard currentUserId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

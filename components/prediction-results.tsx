'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PredictionWithDetails } from '@/lib/supabase';
import { Trophy, CheckCircle2, XCircle, TrendingUp, Users } from 'lucide-react';

type PredictionResultsProps = {
  predictions: PredictionWithDetails[];
  currentUserId?: string;
};

export function PredictionResults({ predictions, currentUserId }: PredictionResultsProps) {
  const revealedPredictions = predictions.filter((p) => p.status === 'revealed');

  if (revealedPredictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Revealed Results
          </CardTitle>
          <CardDescription>
            No predictions have been revealed yet. Check back after the event!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const userStats = {
    total: 0,
    correct: 0,
    incorrect: 0,
    pointsWon: 0,
    pointsLost: 0,
  };

  revealedPredictions.forEach((prediction) => {
    if (prediction.user_bet) {
      userStats.total++;
      const isCorrect = prediction.user_bet.selected_option === prediction.result?.correct_option;
      if (isCorrect) {
        userStats.correct++;
        userStats.pointsWon += prediction.user_bet.points_wagered;
      } else {
        userStats.incorrect++;
        userStats.pointsLost += prediction.user_bet.points_wagered;
      }
    }
  });

  const accuracy = userStats.total > 0
    ? Math.round((userStats.correct / userStats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* User Summary Stats */}
      {currentUserId && userStats.total > 0 && (
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle>Your Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Accuracy</p>
                <p className="text-3xl font-bold text-primary">{accuracy}%</p>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                  <p className="text-sm text-green-500">Correct</p>
                </div>
                <p className="text-3xl font-bold text-green-500">{userStats.correct}</p>
              </div>
              <div className="text-center p-4 bg-red-500/10 rounded-lg">
                <div className="flex items-center justify-center mb-1">
                  <XCircle className="w-4 h-4 text-red-500 mr-1" />
                  <p className="text-sm text-red-500">Incorrect</p>
                </div>
                <p className="text-3xl font-bold text-red-500">{userStats.incorrect}</p>
              </div>
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Net Points</p>
                <p
                  className={`text-3xl font-bold ${
                    userStats.pointsWon - userStats.pointsLost >= 0
                      ? 'text-green-500'
                      : 'text-red-500'
                  }`}
                >
                  {userStats.pointsWon - userStats.pointsLost >= 0 ? '+' : ''}
                  {userStats.pointsWon - userStats.pointsLost}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revealed Predictions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            All Revealed Results
          </CardTitle>
          <CardDescription>
            See how everyone's predictions turned out
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {revealedPredictions.map((prediction) => {
            const hasUserBet = !!prediction.user_bet;
            const userWon = hasUserBet && prediction.user_bet?.selected_option === prediction.result?.correct_option;
            const correctOptionId = prediction.result?.correct_option;
            const correctOption = prediction.options.find(opt => opt.id === correctOptionId);

            return (
              <div
                key={prediction.id}
                className={`p-4 rounded-lg border ${
                  userWon
                    ? 'border-green-500/50 bg-green-500/5'
                    : hasUserBet
                    ? 'border-red-500/50 bg-red-500/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{prediction.title}</h3>
                    {prediction.description && (
                      <p className="text-sm text-muted-foreground">{prediction.description}</p>
                    )}
                  </div>
                  {hasUserBet && (
                    <div>
                      {userWon ? (
                        <Badge className="bg-green-500/20 text-green-500">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Correct
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-500">
                          <XCircle className="w-3 h-3 mr-1" />
                          Incorrect
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Correct Answer */}
                  <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Correct Answer</p>
                          <p className="font-bold text-green-500">{correctOption?.text || correctOptionId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Bets</p>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <p className="font-semibold">{prediction.total_bets}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User's Bet (if exists) */}
                  {hasUserBet && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Your Bet</p>
                          <p className="font-semibold">
                            {prediction.options.find(opt => opt.id === prediction.user_bet?.selected_option)?.text ||
                             prediction.user_bet?.selected_option}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Wagered</p>
                          <p
                            className={`font-bold ${
                              userWon ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            {userWon ? '+' : '-'}
                            {prediction.user_bet?.points_wagered} pts
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Option Distribution */}
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      How everyone voted
                    </p>
                    <div className="space-y-1">
                      {prediction.options.map((option) => {
                        const count = prediction.option_counts[option.id] || 0;
                        const percentage = prediction.total_bets > 0
                          ? Math.round((count / prediction.total_bets) * 100)
                          : 0;
                        const isCorrect = option.id === correctOptionId;

                        return (
                          <div
                            key={option.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div className="flex-1 flex items-center gap-2">
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              )}
                              <span className={isCorrect ? 'font-semibold' : ''}>
                                {option.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-muted rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    isCorrect ? 'bg-green-500' : 'bg-primary'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-muted-foreground w-12 text-right">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

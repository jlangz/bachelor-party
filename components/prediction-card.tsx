'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PredictionWithDetails } from '@/lib/supabase';
import { Clock, TrendingUp, Users, CheckCircle2, XCircle, Trophy, Flame } from 'lucide-react';
import { toast } from 'sonner';

type PredictionCardProps = {
  prediction: PredictionWithDetails;
  userId: string;
  onBetPlaced?: () => void;
  userPoints?: number;
};

export function PredictionCard({ prediction, userId, onBetPlaced, userPoints = 1000 }: PredictionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    prediction.user_bet?.selected_option || ''
  );
  const [pointsWagered, setPointsWagered] = useState<number>(
    prediction.user_bet?.points_wagered || 10
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOpen = prediction.status === 'open';
  const isRevealed = prediction.status === 'revealed';
  const hasUserBet = !!prediction.user_bet;
  const correctOption = prediction.result?.correct_option;
  const userWon = hasUserBet && isRevealed && prediction.user_bet?.selected_option === correctOption;
  const userLost = hasUserBet && isRevealed && prediction.user_bet?.selected_option !== correctOption;

  // Check if betting has opened yet
  const bettingNotYetOpen = prediction.betting_opens_at
    ? new Date(prediction.betting_opens_at) > new Date()
    : false;

  // Check if deadline has passed
  const deadlinePassed = prediction.betting_deadline
    ? new Date(prediction.betting_deadline) < new Date()
    : false;

  const canBet = isOpen && !deadlinePassed && !bettingNotYetOpen;

  const handleSubmitBet = async () => {
    if (!selectedOption || pointsWagered <= 0) {
      toast.error('Please select an option and enter points to wager');
      return;
    }

    if (pointsWagered > userPoints) {
      toast.error(`You only have ${userPoints} points available`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/predictions/${prediction.id}/bet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, selected_option: selectedOption, points_wagered: pointsWagered }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to place bet');
        return;
      }

      toast.success(hasUserBet ? 'Bet updated successfully!' : 'Bet placed successfully!');
      onBetPlaced?.();
    } catch (error) {
      console.error('Error placing bet:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavior':
        return 'bg-blue-500/20 text-blue-400';
      case 'outcome':
        return 'bg-green-500/20 text-green-400';
      case 'timing':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'general':
      default:
        return 'bg-purple-500/20 text-purple-400';
    }
  };

  const getStatusBadge = () => {
    if (isRevealed) {
      return <Badge className="bg-green-500/20 text-green-400">Revealed</Badge>;
    }
    if (deadlinePassed || !isOpen) {
      return <Badge className="bg-yellow-500/20 text-yellow-400">Closed</Badge>;
    }
    if (bettingNotYetOpen) {
      return <Badge className="bg-orange-500/20 text-orange-400">Not Yet Open</Badge>;
    }
    return <Badge className="bg-blue-500/20 text-blue-400">Open</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOptionPercentage = (optionId: string) => {
    if (prediction.total_bets === 0) return 0;
    const count = prediction.option_counts[optionId] || 0;
    return Math.round((count / prediction.total_bets) * 100);
  };

  return (
    <Card className={`${userWon ? 'border-green-500/50' : userLost ? 'border-red-500/50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getCategoryColor(prediction.category)}>
                {prediction.category}
              </Badge>
              {getStatusBadge()}
              {hasUserBet && !isRevealed && (
                <Badge variant="outline" className="text-primary">
                  <Flame className="w-3 h-3 mr-1" />
                  Bet Placed
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">{prediction.title}</CardTitle>
            {prediction.description && (
              <CardDescription className="mt-2">{prediction.description}</CardDescription>
            )}
          </div>
          {userWon && (
            <Trophy className="w-8 h-8 text-green-500" />
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{prediction.total_bets} bets</span>
          </div>
          {prediction.betting_opens_at && bettingNotYetOpen && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Opens: {formatDate(prediction.betting_opens_at)}</span>
            </div>
          )}
          {prediction.betting_deadline && !bettingNotYetOpen && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Deadline: {formatDate(prediction.betting_deadline)}</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Options */}
        <div className="space-y-2">
          {prediction.options.map((option) => {
            const isCorrect = isRevealed && option.id === correctOption;
            const isUserChoice = option.id === (hasUserBet ? prediction.user_bet?.selected_option : selectedOption);
            const percentage = getOptionPercentage(option.id);

            return (
              <div
                key={option.id}
                className={`relative p-3 border rounded-lg cursor-pointer transition-colors ${
                  isCorrect
                    ? 'border-green-500 bg-green-500/10'
                    : isRevealed && isUserChoice
                    ? 'border-red-500 bg-red-500/10'
                    : isUserChoice && !isRevealed
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                } ${!canBet && !isRevealed ? 'cursor-not-allowed opacity-60' : ''}`}
                onClick={() => {
                  if (canBet) setSelectedOption(option.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        isUserChoice
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    />
                    <span className="font-medium">{option.text}</span>
                    {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {isRevealed && isUserChoice && !isCorrect && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  {(isRevealed || !isOpen || deadlinePassed) && prediction.total_bets > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Betting Not Yet Open Message */}
        {isOpen && bettingNotYetOpen && !hasUserBet && (
          <div className="p-3 bg-orange-500/10 border border-orange-500/50 rounded-lg">
            <p className="text-sm font-medium text-orange-500 mb-1">Betting Opens Soon</p>
            <p className="text-sm text-muted-foreground">
              You can place your bet starting {formatDate(prediction.betting_opens_at)}
            </p>
          </div>
        )}

        {/* Betting Interface */}
        {canBet && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor={`points-${prediction.id}`}>
                Points to Wager (You have {userPoints} pts)
              </Label>
              <Input
                id={`points-${prediction.id}`}
                type="number"
                min="1"
                max={userPoints}
                value={pointsWagered}
                onChange={(e) => setPointsWagered(parseInt(e.target.value) || 0)}
                className="w-full"
              />
              <div className="flex gap-2">
                {[10, 25, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    onClick={() => setPointsWagered(Math.min(amount, userPoints))}
                    disabled={amount > userPoints}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleSubmitBet}
              disabled={!selectedOption || pointsWagered <= 0 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Placing Bet...' : hasUserBet ? 'Update Bet' : 'Place Bet'}
            </Button>
          </div>
        )}

        {/* User's Bet Info (when closed or revealed) */}
        {hasUserBet && !canBet && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Your Bet</p>
                <p className="text-lg">
                  {prediction.options.find(opt => opt.id === prediction.user_bet?.selected_option)?.text ||
                   prediction.user_bet?.selected_option}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Wagered</p>
                <p className="text-lg font-bold text-primary">
                  {prediction.user_bet?.points_wagered} pts
                </p>
              </div>
            </div>
            {isRevealed && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p
                  className={`text-center font-semibold ${
                    userWon ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {userWon
                    ? `You Won! +${prediction.user_bet?.points_wagered} pts`
                    : `You Lost -${prediction.user_bet?.points_wagered} pts`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Revealed Result (no user bet) */}
        {isRevealed && !hasUserBet && (
          <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Correct Answer:</p>
            <p className="text-lg font-bold text-green-500">
              {prediction.options.find(opt => opt.id === correctOption)?.text || correctOption}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

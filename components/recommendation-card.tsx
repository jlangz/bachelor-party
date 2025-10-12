'use client';

import { useState } from 'react';
import { RecommendationWithUser, RecommendationCommentWithUser } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Heart, MessageCircle, MapPin, ExternalLink, DollarSign, Calendar, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface RecommendationCardProps {
  recommendation: RecommendationWithUser;
  currentUserId: string;
  onLikeToggle: (recId: string, currentlyLiked: boolean) => Promise<void>;
  onCommentAdd: (recId: string, comment: string) => Promise<void>;
  onCommentDelete: (commentId: string) => Promise<void>;
  onViewOnMap: (recId: string) => void;
  onDelete?: (recId: string) => Promise<void>;
}

const CATEGORY_ICONS: Record<string, string> = {
  restaurant: '🍽️',
  bar: '🍸',
  club: '💃',
  cafe: '☕',
  other: '📍',
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: 'bg-red-500/10 text-red-500 border-red-500/20',
  bar: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  club: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  cafe: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const RESERVATION_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: 'No Reservation Needed', color: 'text-muted-foreground' },
  recommended: { label: 'Reservation Recommended', color: 'text-yellow-500' },
  required: { label: 'Reservation Required', color: 'text-orange-500' },
  booked: { label: 'Reservation Booked', color: 'text-green-500' },
};

export function RecommendationCard({
  recommendation,
  currentUserId,
  onLikeToggle,
  onCommentAdd,
  onCommentDelete,
  onViewOnMap,
  onDelete,
}: RecommendationCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState<RecommendationCommentWithUser[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const isOwner = recommendation.user_id === currentUserId;

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await onLikeToggle(recommendation.id, recommendation.user_has_liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    setIsCommenting(true);
    try {
      await onCommentAdd(recommendation.id, newComment);
      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/recommendations/${recommendation.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleShowComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await onCommentDelete(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Are you sure you want to delete this recommendation?')) return;

    try {
      await onDelete(recommendation.id);
      toast.success('Recommendation deleted');
    } catch (error) {
      console.error('Error deleting recommendation:', error);
    }
  };

  return (
    <Card className="hover:border-primary/50 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{CATEGORY_ICONS[recommendation.category]}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[recommendation.category]}`}>
                {recommendation.category}
              </span>
              {recommendation.price_range && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {recommendation.price_range}
                </span>
              )}
            </div>
            <CardTitle className="text-xl">{recommendation.name}</CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-start gap-1">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span className="text-xs">{recommendation.address}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs">Added by {recommendation.user.name}</span>
              </div>
            </CardDescription>
          </div>
          {isOwner && onDelete && (
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {recommendation.description && (
          <p className="text-sm text-muted-foreground">{recommendation.description}</p>
        )}

        {recommendation.reservation_status !== 'none' && (
          <div className="flex items-start gap-2 p-3 bg-accent/50 rounded-lg">
            <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className={`text-sm font-medium ${RESERVATION_STATUS_LABELS[recommendation.reservation_status].color}`}>
                {RESERVATION_STATUS_LABELS[recommendation.reservation_status].label}
              </p>
              {recommendation.reservation_notes && (
                <p className="text-xs text-muted-foreground mt-1">{recommendation.reservation_notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={recommendation.user_has_liked ? 'text-red-500 border-red-500/50' : ''}
          >
            <Heart className={`w-4 h-4 mr-1 ${recommendation.user_has_liked ? 'fill-current' : ''}`} />
            {recommendation.likes_count}
          </Button>

          <Button variant="outline" size="sm" onClick={handleShowComments}>
            <MessageCircle className="w-4 h-4 mr-1" />
            {recommendation.comments_count}
          </Button>

          <Button variant="outline" size="sm" onClick={() => onViewOnMap(recommendation.id)}>
            <MapPin className="w-4 h-4 mr-1 sm:inline hidden" />
            <MapPin className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">View on Map</span>
            <span className="sm:hidden">Map</span>
          </Button>

          {recommendation.google_maps_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={recommendation.google_maps_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1 sm:inline hidden" />
                <ExternalLink className="w-4 h-4 sm:hidden" />
                <span className="hidden sm:inline">Directions</span>
                <span className="sm:hidden">Dir</span>
              </a>
            </Button>
          )}
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="border-t border-border pt-4 space-y-4">
            {loadingComments ? (
              <div className="text-center text-sm text-muted-foreground">Loading comments...</div>
            ) : (
              <>
                {comments.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-accent/30 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-muted-foreground">{comment.user.name}</p>
                            <p className="text-sm mt-1">{comment.comment}</p>
                          </div>
                          {comment.user_id === currentUserId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-destructive hover:text-destructive h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No comments yet</p>
                )}

                {/* Add Comment */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                  <Button onClick={handleCommentSubmit} disabled={isCommenting || !newComment.trim()} className="self-end">
                    Post
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

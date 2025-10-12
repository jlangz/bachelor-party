'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Heart, MessageCircle, Trash2, X, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface PostUser {
  id: string;
  name: string;
}

interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user: PostUser;
}

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: PostUser;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onLikeToggle: (postId: string, currentlyLiked: boolean) => Promise<void>;
  onCommentAdd: (postId: string, comment: string) => Promise<void>;
  onCommentDelete: (commentId: string) => Promise<void>;
  onDelete?: (postId: string) => Promise<void>;
  onEdit?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLikeToggle,
  onCommentAdd,
  onCommentDelete,
  onDelete,
  onEdit,
}: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const isOwner = post.user_id === currentUserId;

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await onLikeToggle(post.id, post.user_has_liked);
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
      await onCommentAdd(post.id, newComment);
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
      const response = await fetch(`/api/posts/${post.id}/comments`);
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
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await onDelete(post.id);
      toast.success('Post deleted');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:border-primary/50 transition-all">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl">{post.title}</CardTitle>
            <CardDescription className="mt-1">
              <div className="flex items-center gap-2 text-xs">
                <span>Posted by {post.user.name}</span>
                <span>•</span>
                <span>{formatDate(post.created_at)}</span>
                {post.updated_at !== post.created_at && (
                  <>
                    <span>•</span>
                    <span className="text-muted-foreground/70">edited</span>
                  </>
                )}
              </div>
            </CardDescription>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={() => onEdit(post.id)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div
          className="prose prose-invert prose-sm max-w-none
                     prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 first:prose-headings:mt-0
                     prose-h2:text-xl prose-h3:text-lg
                     prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                     prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                     prose-strong:text-foreground prose-strong:font-semibold
                     prose-ul:text-muted-foreground prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ul:space-y-1
                     prose-ol:text-muted-foreground prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4 prose-ol:space-y-1
                     prose-li:text-muted-foreground
                     [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                     [&_p:empty]:min-h-[1.5em]"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className={post.user_has_liked ? 'text-red-500 border-red-500/50' : ''}
          >
            <Heart className={`w-4 h-4 mr-1 ${post.user_has_liked ? 'fill-current' : ''}`} />
            {post.likes_count}
          </Button>

          <Button variant="outline" size="sm" onClick={handleShowComments}>
            <MessageCircle className="w-4 h-4 mr-1" />
            {post.comments_count}
          </Button>
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

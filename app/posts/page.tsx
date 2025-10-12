'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { PostCard } from '@/components/post-card';
import { PostForm, PostFormData } from '@/components/post-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

interface PostUser {
  id: string;
  name: string;
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

export default function PostsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/posts?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        toast.error('Failed to load posts');
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = async (formData: PostFormData) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        setShowAddForm(false);
        toast.success('Post created!');
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
      throw error;
    }
  };

  const handleEditPost = async (formData: PostFormData) => {
    if (!editingPost) return;

    try {
      const response = await fetch(`/api/posts/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map((p) => (p.id === updatedPost.id ? { ...updatedPost, likes_count: p.likes_count, comments_count: p.comments_count, user_has_liked: p.user_has_liked } : p)));
        setEditingPost(null);
        toast.success('Post updated!');
      } else {
        throw new Error('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
      throw error;
    }
  };

  const handleLikeToggle = async (postId: string, currentlyLiked: boolean) => {
    if (!user) return;

    try {
      if (currentlyLiked) {
        const response = await fetch(`/api/posts/${postId}/like?userId=${user.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? { ...post, likes_count: post.likes_count - 1, user_has_liked: false }
                : post
            )
          );
        }
      } else {
        const response = await fetch(`/api/posts/${postId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id }),
        });

        if (response.ok) {
          setPosts((prev) =>
            prev.map((post) =>
              post.id === postId
                ? { ...post, likes_count: post.likes_count + 1, user_has_liked: true }
                : post
            )
          );
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleCommentAdd = async (postId: string, comment: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, comment }),
      });

      if (response.ok) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, comments_count: post.comments_count + 1 } : post
          )
        );
        toast.success('Comment added!');
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      throw error;
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    try {
      const response = await fetch(`/api/posts/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadPosts();
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
      throw error;
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts((prev) => prev.filter((post) => post.id !== postId));
        toast.success('Post deleted');
      } else {
        throw new Error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
      throw error;
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.user.name.toLowerCase().includes(query)
    );
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Posts</h1>
            <p className="text-muted-foreground text-lg">
              Share updates, thoughts, and discussions with the group
            </p>
          </div>
          {!showAddForm && !editingPost && (
            <Button onClick={() => setShowAddForm(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Post
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-8">
            <PostForm
              userId={user.id}
              onSubmit={handleAddPost}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {editingPost && (
          <div className="mb-8">
            <PostForm
              userId={user.id}
              initialData={{
                title: editingPost.title,
                content: editingPost.content,
              }}
              onSubmit={handleEditPost}
              onCancel={() => setEditingPost(null)}
              submitLabel="Update"
            />
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Posts List */}
        <div className="max-w-4xl mx-auto">
          {filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user.id}
                  onLikeToggle={handleLikeToggle}
                  onCommentAdd={handleCommentAdd}
                  onCommentDelete={handleCommentDelete}
                  onDelete={handleDelete}
                  onEdit={(postId) => {
                    const post = posts.find((p) => p.id === postId);
                    if (post) setEditingPost(post);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-muted-foreground">No posts found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Be the first to share something with the group!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

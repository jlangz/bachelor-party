'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { RecommendationsMap } from '@/components/recommendations-map';
import { RecommendationList } from '@/components/recommendation-list';
import { RecommendationForm, RecommendationFormData } from '@/components/recommendation-form';
import { RecommendationWithUser } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Map, List } from 'lucide-react';
import { toast } from 'sonner';

export default function RecommendationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/recommendations?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      } else {
        toast.error('Failed to load recommendations');
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecommendation = async (formData: RecommendationFormData) => {
    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newRec = await response.json();
        setRecommendations([newRec, ...recommendations]);
        setShowAddForm(false);
        toast.success('Recommendation added!');
      } else {
        throw new Error('Failed to add recommendation');
      }
    } catch (error) {
      console.error('Error adding recommendation:', error);
      toast.error('Failed to add recommendation');
      throw error;
    }
  };

  const handleLikeToggle = async (recId: string, currentlyLiked: boolean) => {
    if (!user) return;

    try {
      if (currentlyLiked) {
        // Unlike
        const response = await fetch(`/api/recommendations/${recId}/like?userId=${user.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setRecommendations((prev) =>
            prev.map((rec) =>
              rec.id === recId
                ? { ...rec, likes_count: rec.likes_count - 1, user_has_liked: false }
                : rec
            )
          );
        }
      } else {
        // Like
        const response = await fetch(`/api/recommendations/${recId}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id }),
        });

        if (response.ok) {
          setRecommendations((prev) =>
            prev.map((rec) =>
              rec.id === recId
                ? { ...rec, likes_count: rec.likes_count + 1, user_has_liked: true }
                : rec
            )
          );
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleCommentAdd = async (recId: string, comment: string) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/recommendations/${recId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, comment }),
      });

      if (response.ok) {
        setRecommendations((prev) =>
          prev.map((rec) =>
            rec.id === recId ? { ...rec, comments_count: rec.comments_count + 1 } : rec
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
      const response = await fetch(`/api/recommendations/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh recommendations to update comment counts
        await loadRecommendations();
      } else {
        throw new Error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
      throw error;
    }
  };

  const handleDelete = async (recId: string) => {
    try {
      const response = await fetch(`/api/recommendations/${recId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRecommendations((prev) => prev.filter((rec) => rec.id !== recId));
        toast.success('Recommendation deleted');
      } else {
        throw new Error('Failed to delete recommendation');
      }
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      toast.error('Failed to delete recommendation');
      throw error;
    }
  };

  const handleViewOnMap = (recId: string) => {
    setSelectedRecommendationId(recId);
    setActiveTab('map');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Places to Check Out</h1>
            <p className="text-muted-foreground text-lg">
              Restaurants, bars, and spots recommended by the group
            </p>
          </div>
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Add Place
            </Button>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-8">
            <RecommendationForm
              userId={user.id}
              onSubmit={handleAddRecommendation}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary">{recommendations.length}</div>
            <div className="text-sm text-muted-foreground">Total Places</div>
          </div>
          <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-500">
              {recommendations.filter((r) => r.category === 'restaurant').length}
            </div>
            <div className="text-sm text-muted-foreground">Restaurants</div>
          </div>
          <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-500">
              {recommendations.filter((r) => r.category === 'bar').length}
            </div>
            <div className="text-sm text-muted-foreground">Bars</div>
          </div>
          <div className="bg-card/50 backdrop-blur border border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-pink-500">
              {recommendations.filter((r) => r.category === 'club').length}
            </div>
            <div className="text-sm text-muted-foreground">Clubs</div>
          </div>
        </div>

        {/* Map and List */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'map' | 'list')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="map" className="gap-2">
              <Map className="w-4 h-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-0">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-[600px]">
                <RecommendationsMap
                  recommendations={recommendations}
                  selectedId={selectedRecommendationId}
                  onMarkerClick={(rec) => setSelectedRecommendationId(rec.id)}
                />
              </div>
              <div className="h-[600px] overflow-y-auto">
                <RecommendationList
                  recommendations={recommendations}
                  currentUserId={user.id}
                  onLikeToggle={handleLikeToggle}
                  onCommentAdd={handleCommentAdd}
                  onCommentDelete={handleCommentDelete}
                  onViewOnMap={handleViewOnMap}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-0">
            <div className="max-w-4xl mx-auto">
              <RecommendationList
                recommendations={recommendations}
                currentUserId={user.id}
                onLikeToggle={handleLikeToggle}
                onCommentAdd={handleCommentAdd}
                onCommentDelete={handleCommentDelete}
                onViewOnMap={handleViewOnMap}
                onDelete={handleDelete}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

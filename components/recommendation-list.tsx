'use client';

import { useState, useMemo } from 'react';
import { RecommendationWithUser, RecommendationCategory, PriceRange } from '@/lib/supabase';
import { RecommendationCard } from './recommendation-card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';

interface RecommendationListProps {
  recommendations: RecommendationWithUser[];
  currentUserId: string;
  onLikeToggle: (recId: string, currentlyLiked: boolean) => Promise<void>;
  onCommentAdd: (recId: string, comment: string) => Promise<void>;
  onCommentDelete: (commentId: string) => Promise<void>;
  onViewOnMap: (recId: string) => void;
  onDelete?: (recId: string) => Promise<void>;
}

type SortOption = 'newest' | 'oldest' | 'most_liked' | 'most_commented';

export function RecommendationList({
  recommendations,
  currentUserId,
  onLikeToggle,
  onCommentAdd,
  onCommentDelete,
  onViewOnMap,
  onDelete,
}: RecommendationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RecommendationCategory | 'all'>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  const filteredAndSortedRecommendations = useMemo(() => {
    let filtered = [...recommendations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (rec) =>
          rec.name.toLowerCase().includes(query) ||
          rec.description?.toLowerCase().includes(query) ||
          rec.address.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((rec) => rec.category === selectedCategory);
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      filtered = filtered.filter((rec) => rec.price_range === selectedPriceRange);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_liked':
          return b.likes_count - a.likes_count;
        case 'most_commented':
          return b.comments_count - a.comments_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [recommendations, searchQuery, selectedCategory, selectedPriceRange, sortBy]);

  const categoryOptions: { value: RecommendationCategory | 'all'; label: string; emoji: string }[] = [
    { value: 'all', label: 'All', emoji: '🗺️' },
    { value: 'restaurant', label: 'Restaurants', emoji: '🍽️' },
    { value: 'bar', label: 'Bars', emoji: '🍸' },
    { value: 'club', label: 'Clubs', emoji: '💃' },
    { value: 'cafe', label: 'Cafes', emoji: '☕' },
    { value: 'other', label: 'Other', emoji: '📍' },
  ];

  const priceOptions: { value: PriceRange | 'all'; label: string }[] = [
    { value: 'all', label: 'All Prices' },
    { value: '$', label: '$' },
    { value: '$$', label: '$$' },
    { value: '$$$', label: '$$$' },
    { value: '$$$$', label: '$$$$' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'most_liked', label: 'Most Liked' },
    { value: 'most_commented', label: 'Most Commented' },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search recommendations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-accent' : ''}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border border-border rounded-lg space-y-4 bg-card">
          {/* Category Pills */}
          <div>
            <label className="text-sm font-medium mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedCategory === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(option.value)}
                >
                  {option.emoji} {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">Price Range</label>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedPriceRange === option.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPriceRange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredAndSortedRecommendations.length} {filteredAndSortedRecommendations.length === 1 ? 'place' : 'places'}
        {(searchQuery || selectedCategory !== 'all' || selectedPriceRange !== 'all') && ' found'}
      </div>

      {/* Recommendations List */}
      {filteredAndSortedRecommendations.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedRecommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              currentUserId={currentUserId}
              onLikeToggle={onLikeToggle}
              onCommentAdd={onCommentAdd}
              onCommentDelete={onCommentDelete}
              onViewOnMap={onViewOnMap}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg font-medium text-muted-foreground">No recommendations found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery || selectedCategory !== 'all' || selectedPriceRange !== 'all'
              ? 'Try adjusting your filters'
              : 'Be the first to add a recommendation!'}
          </p>
        </div>
      )}
    </div>
  );
}

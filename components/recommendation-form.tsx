'use client';

import { useState, useEffect, useRef } from 'react';
import { RecommendationCategory, PriceRange, ReservationStatus } from '@/lib/supabase';
import { useGoogleMaps } from '@/lib/use-google-maps';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { X, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface RecommendationFormProps {
  userId: string;
  onSubmit: (data: RecommendationFormData) => Promise<void>;
  onCancel: () => void;
}

export interface RecommendationFormData {
  user_id: string;
  name: string;
  category: RecommendationCategory;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  google_maps_url: string | null;
  price_range: PriceRange | null;
  reservation_status: ReservationStatus;
  reservation_notes: string;
}

export function RecommendationForm({ userId, onSubmit, onCancel }: RecommendationFormProps) {
  const [formData, setFormData] = useState<RecommendationFormData>({
    user_id: userId,
    name: '',
    category: 'restaurant' as RecommendationCategory,
    description: '',
    address: '',
    latitude: 0,
    longitude: 0,
    google_maps_url: null,
    price_range: null,
    reservation_status: 'none',
    reservation_notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapsLoaded = useGoogleMaps();
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Initialize Google Places Autocomplete once Google Maps is loaded
  useEffect(() => {
    if (!mapsLoaded || !addressInputRef.current || autocompleteRef.current) return;

    try {
      const google = (window as any).google;
      const autocomplete = new google.maps.places.Autocomplete(addressInputRef.current, {
          types: ['establishment'],
          componentRestrictions: { country: 'us' },
          fields: ['name', 'formatted_address', 'geometry', 'place_id', 'url', 'price_level', 'types'],
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();

          if (!place.geometry?.location) {
            toast.error('Please select a place from the dropdown');
            return;
          }

          // Determine category from place types
          let category: RecommendationCategory = 'other';
          if (place.types) {
            if (place.types.includes('restaurant') || place.types.includes('food')) {
              category = 'restaurant';
            } else if (place.types.includes('bar') || place.types.includes('night_club')) {
              category = 'bar';
            } else if (place.types.includes('night_club')) {
              category = 'club';
            } else if (place.types.includes('cafe')) {
              category = 'cafe';
            }
          }

          // Determine price range from price_level (0-4)
          let priceRange: PriceRange | null = null;
          if (place.price_level !== undefined) {
            const priceMap: Record<number, PriceRange> = {
              0: '$',
              1: '$',
              2: '$$',
              3: '$$$',
              4: '$$$$',
            };
            priceRange = priceMap[place.price_level] || null;
          }

          setFormData((prev) => ({
            ...prev,
            name: place.name || prev.name,
            address: place.formatted_address || prev.address,
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            google_maps_url: place.url || null,
            category,
            price_range: priceRange,
          }));
        });

        autocompleteRef.current = autocomplete;
      } catch (error) {
        console.error('Error initializing Google Places:', error);
        toast.error('Failed to load address autocomplete');
      }
  }, [mapsLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.address || !formData.latitude || !formData.longitude) {
      toast.error('Please fill in all required fields and select a valid address');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success('Recommendation added successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to add recommendation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Add a Recommendation</CardTitle>
            <CardDescription>Share a restaurant, bar, or place to check out in Vegas</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address (with Autocomplete) */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Search for a Place <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={addressInputRef}
                id="address"
                placeholder="Start typing to search (e.g., 'Gordon Ramsay Hell's Kitchen')"
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Select from the dropdown to auto-fill details
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Place name"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-destructive">*</span>
            </Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as RecommendationCategory })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="restaurant">🍽️ Restaurant</option>
              <option value="bar">🍸 Bar</option>
              <option value="club">💃 Club</option>
              <option value="cafe">☕ Cafe</option>
              <option value="other">📍 Other</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-2">
            <Label htmlFor="price_range">Price Range</Label>
            <select
              id="price_range"
              value={formData.price_range || ''}
              onChange={(e) => setFormData({ ...formData, price_range: (e.target.value as PriceRange) || null })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Not specified</option>
              <option value="$">$ - Inexpensive</option>
              <option value="$$">$$ - Moderate</option>
              <option value="$$$">$$$ - Expensive</option>
              <option value="$$$$">$$$$ - Very Expensive</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Why do you recommend this place?"
              rows={3}
            />
          </div>

          {/* Reservation Status */}
          <div className="space-y-2">
            <Label htmlFor="reservation_status">Reservation Status</Label>
            <select
              id="reservation_status"
              value={formData.reservation_status}
              onChange={(e) => setFormData({ ...formData, reservation_status: e.target.value as ReservationStatus })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="none">No reservation needed</option>
              <option value="recommended">Reservation recommended</option>
              <option value="required">Reservation required</option>
              <option value="booked">Reservation already booked</option>
            </select>
          </div>

          {/* Reservation Notes */}
          {formData.reservation_status !== 'none' && (
            <div className="space-y-2">
              <Label htmlFor="reservation_notes">Reservation Notes</Label>
              <Input
                id="reservation_notes"
                value={formData.reservation_notes}
                onChange={(e) => setFormData({ ...formData, reservation_notes: e.target.value })}
                placeholder="e.g., Book through OpenTable, ask for rooftop seating"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Adding...' : 'Add Recommendation'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { RecommendationWithUser, RecommendationCategory } from '@/lib/supabase';
import { useGoogleMaps } from '@/lib/use-google-maps';

interface RecommendationsMapProps {
  recommendations: RecommendationWithUser[];
  selectedId?: string | null;
  onMarkerClick?: (recommendation: RecommendationWithUser) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
}

// Marker colors by category
const MARKER_COLORS: Record<RecommendationCategory, string> = {
  restaurant: '#EF4444', // red
  bar: '#8B5CF6', // purple
  club: '#EC4899', // pink
  cafe: '#F59E0B', // amber
  other: '#6B7280', // gray
};

export function RecommendationsMap({
  recommendations,
  selectedId,
  onMarkerClick,
  center = { lat: 36.1699, lng: -115.1398 }, // Las Vegas default
  zoom = 12,
}: RecommendationsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const mapsLoaded = useGoogleMaps();
  const [mapInitialized, setMapInitialized] = useState(false);

  // Initialize map once Google Maps is loaded
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || mapInitialized) return;

    try {
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      googleMapRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();
      setMapInitialized(true);
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
    }
  }, [mapsLoaded, mapInitialized, center, zoom]);

  // Update markers when recommendations change
  useEffect(() => {
    if (!googleMapRef.current || !mapInitialized) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds();

    recommendations.forEach((rec) => {
      const position = { lat: rec.latitude, lng: rec.longitude };

      // Create custom marker with color
      const marker = new google.maps.Marker({
        position,
        map: googleMapRef.current!,
        title: rec.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: MARKER_COLORS[rec.category],
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(rec);
        }

        // Show info window
        const content = `
          <div style="padding: 8px; max-width: 250px;">
            <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">${rec.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666; text-transform: capitalize;">${rec.category} ${rec.price_range ? '• ' + rec.price_range : ''}</p>
            ${rec.description ? `<p style="margin: 0 0 8px 0; font-size: 14px;">${rec.description}</p>` : ''}
            <p style="margin: 0; font-size: 12px; color: #666;">${rec.address}</p>
            <div style="margin-top: 8px;">
              <span style="font-size: 12px; color: #666;">❤️ ${rec.likes_count} • 💬 ${rec.comments_count}</span>
            </div>
          </div>
        `;

        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.open(googleMapRef.current!, marker);
      });

      markersRef.current.set(rec.id, marker);
      bounds.extend(position);
    });

    // Fit bounds if there are recommendations
    if (recommendations.length > 0) {
      googleMapRef.current.fitBounds(bounds);

      // Ensure zoom is not too close
      const listener = google.maps.event.addListener(googleMapRef.current, 'idle', () => {
        const currentZoom = googleMapRef.current?.getZoom();
        if (currentZoom && currentZoom > 15) {
          googleMapRef.current?.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [recommendations, mapInitialized, onMarkerClick]);

  // Highlight selected marker
  useEffect(() => {
    if (!selectedId) return;

    const selectedMarker = markersRef.current.get(selectedId);
    if (selectedMarker && googleMapRef.current) {
      // Pulse animation effect
      const originalIcon = selectedMarker.getIcon() as google.maps.Symbol;
      selectedMarker.setIcon({
        ...originalIcon,
        scale: 14,
      });

      // Pan to marker
      googleMapRef.current.panTo(selectedMarker.getPosition()!);

      // Reset after animation
      setTimeout(() => {
        selectedMarker.setIcon(originalIcon);
      }, 300);
    }
  }, [selectedId]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-border">
      <div ref={mapRef} className="w-full h-full" />
      {!mapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}

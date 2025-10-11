'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Home, Info } from 'lucide-react';
import { EventInfo } from '@/lib/supabase';

export default function InfoPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchEventInfo();
  }, []);

  const fetchEventInfo = async () => {
    try {
      const response = await fetch('/api/event-info');
      if (response.ok) {
        const data = await response.json();
        setEventInfo(data);
      }
    } catch (error) {
      console.error('Error fetching event info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start || !end) return 'Dates TBA';

    const startDate = new Date(start);
    const endDate = new Date(end);

    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };

    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      return `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
    }

    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!eventInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Event information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {eventInfo.event_name}
          </h1>
          {eventInfo.description && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {eventInfo.description}
            </p>
          )}
          <p className="text-lg text-muted-foreground mt-2">
            {formatDateRange(eventInfo.event_date_start, eventInfo.event_date_end)}
          </p>
        </div>

        {/* Key Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Dates */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">When</h3>
              <p className="text-sm text-muted-foreground">
                {formatDateRange(eventInfo.event_date_start, eventInfo.event_date_end)}
              </p>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Where</h3>
              <p className="text-sm text-muted-foreground">
                {eventInfo.location_name || 'Location TBA'}
              </p>
              {eventInfo.location_address && (
                <>
                  <p className="text-xs text-muted-foreground mt-1">
                    {eventInfo.location_address}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventInfo.location_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs mt-2 inline-block"
                  >
                    Open in Google Maps →
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          {/* Accommodations */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Accommodations</h3>
              <p className="text-sm text-muted-foreground">
                {eventInfo.house_beds_total} beds available
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                First come, first served
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Schedule */}
        {eventInfo.schedule && eventInfo.schedule.length > 0 && (
          <Card className="mb-12 bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Calendar className="w-6 h-6 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {eventInfo.schedule.map((item, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="flex-shrink-0 w-32 text-right">
                      <span className="text-sm font-medium text-primary">
                        {item.time}
                      </span>
                    </div>
                    <div className="relative flex-1 pb-6 border-l-2 border-border pl-6 last:pb-0">
                      <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-primary -translate-x-[7px]"></div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Information */}
        {eventInfo.important_info && eventInfo.important_info.length > 0 && (
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Info className="w-6 h-6 text-primary" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {eventInfo.important_info.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="font-semibold text-primary">{item.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

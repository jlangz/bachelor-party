'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar, MapPin, Home, Save } from 'lucide-react';
import { EventInfo } from '@/lib/supabase';

interface EventInfoEditorProps {
  userId: string;
}

export function EventInfoEditor({ userId }: EventInfoEditorProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);

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
      toast.error('Failed to load event info');
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/event-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...eventInfo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEventInfo(data);
        toast.success('Event info updated successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update event info');
      }
    } catch (error) {
      console.error('Error updating event info:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (!eventInfo) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Failed to load event info
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Event Information
        </CardTitle>
        <CardDescription>
          Manage the bachelor party event details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event_name">Event Name</Label>
            <Input
              id="event_name"
              value={eventInfo.event_name}
              onChange={(e) => setEventInfo({ ...eventInfo, event_name: e.target.value })}
              placeholder="Bachelor Party Weekend"
              required
              disabled={loading}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_date_start">Start Date</Label>
              <Input
                id="event_date_start"
                type="date"
                value={eventInfo.event_date_start || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, event_date_start: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date_end">End Date</Label>
              <Input
                id="event_date_end"
                type="date"
                value={eventInfo.event_date_end || ''}
                onChange={(e) => setEventInfo({ ...eventInfo, event_date_end: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_name" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Name
            </Label>
            <Input
              id="location_name"
              value={eventInfo.location_name || ''}
              onChange={(e) => setEventInfo({ ...eventInfo, location_name: e.target.value })}
              placeholder="The House"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_address">Address</Label>
            <Input
              id="location_address"
              value={eventInfo.location_address || ''}
              onChange={(e) => setEventInfo({ ...eventInfo, location_address: e.target.value })}
              placeholder="123 Party Street, Fun City, FC 12345"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={eventInfo.description || ''}
              onChange={(e) => setEventInfo({ ...eventInfo, description: e.target.value })}
              placeholder="Join us for an epic bachelor party weekend!"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="house_beds_total" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Total House Beds Available
            </Label>
            <Input
              id="house_beds_total"
              type="number"
              min="0"
              value={eventInfo.house_beds_total}
              onChange={(e) => setEventInfo({ ...eventInfo, house_beds_total: parseInt(e.target.value) || 0 })}
              disabled={loading}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Event Info'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

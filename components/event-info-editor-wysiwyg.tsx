'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/rich-text-editor';
import { toast } from 'sonner';
import { Calendar, MapPin, Home, Save, Plus, Trash2, Eye } from 'lucide-react';
import { EventInfo, ScheduleItem, ImportantInfoItem } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EventInfoEditorWYSIWYGProps {
  userId: string;
}

export function EventInfoEditorWYSIWYG({ userId }: EventInfoEditorWYSIWYGProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

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

  const addScheduleItem = () => {
    if (!eventInfo) return;
    const newItem: ScheduleItem = {
      time: '',
      title: '',
      description: '',
    };
    setEventInfo({
      ...eventInfo,
      schedule: [...(eventInfo.schedule || []), newItem],
    });
  };

  const updateScheduleItem = (index: number, field: keyof ScheduleItem, value: string) => {
    if (!eventInfo) return;
    const newSchedule = [...(eventInfo.schedule || [])];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setEventInfo({ ...eventInfo, schedule: newSchedule });
  };

  const removeScheduleItem = (index: number) => {
    if (!eventInfo) return;
    const newSchedule = eventInfo.schedule.filter((_, i) => i !== index);
    setEventInfo({ ...eventInfo, schedule: newSchedule });
  };

  const addImportantInfo = () => {
    if (!eventInfo) return;
    const newItem: ImportantInfoItem = {
      title: '',
      content: '',
    };
    setEventInfo({
      ...eventInfo,
      important_info: [...(eventInfo.important_info || []), newItem],
    });
  };

  const updateImportantInfo = (index: number, field: keyof ImportantInfoItem, value: string) => {
    if (!eventInfo) return;
    const newInfo = [...(eventInfo.important_info || [])];
    newInfo[index] = { ...newInfo[index], [field]: value };
    setEventInfo({ ...eventInfo, important_info: newInfo });
  };

  const removeImportantInfo = (index: number) => {
    if (!eventInfo) return;
    const newInfo = eventInfo.important_info.filter((_, i) => i !== index);
    setEventInfo({ ...eventInfo, important_info: newInfo });
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Information Editor
            </CardTitle>
            <CardDescription>
              Edit your event page like a document - changes appear on /info page
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => window.open('/info', '_blank')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Page
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="info">Important Info</TabsTrigger>
            </TabsList>

            {/* Basics Tab */}
            <TabsContent value="basics" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="event_name">Event Name *</Label>
                <Input
                  id="event_name"
                  value={eventInfo.event_name}
                  onChange={(e) => setEventInfo({ ...eventInfo, event_name: e.target.value })}
                  placeholder="Bachelor Party Weekend"
                  required
                  disabled={loading}
                  className="text-lg font-semibold"
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
                <Label htmlFor="location_address">Full Address</Label>
                <Input
                  id="location_address"
                  value={eventInfo.location_address || ''}
                  onChange={(e) => setEventInfo({ ...eventInfo, location_address: e.target.value })}
                  placeholder="123 Party Street, Fun City, FC 12345"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Will be used for Google Maps link
                </p>
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
            </TabsContent>

            {/* Description Tab */}
            <TabsContent value="description" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Event Description (appears at top of page)</Label>
                <Textarea
                  value={eventInfo.description || ''}
                  onChange={(e) => setEventInfo({ ...eventInfo, description: e.target.value })}
                  placeholder="Join us for an epic bachelor party weekend!"
                  rows={3}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Keep it short and welcoming - appears as subtitle on the info page
                </p>
              </div>
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base">Schedule Timeline</Label>
                <Button
                  type="button"
                  onClick={addScheduleItem}
                  size="sm"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {eventInfo.schedule && eventInfo.schedule.length > 0 ? (
                <div className="space-y-4">
                  {eventInfo.schedule.map((item, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Item {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScheduleItem(index)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        <Input
                          placeholder="Time (e.g., Friday 6:00 PM)"
                          value={item.time}
                          onChange={(e) => updateScheduleItem(index, 'time', e.target.value)}
                          disabled={loading}
                        />
                        <Input
                          placeholder="Title"
                          value={item.title}
                          onChange={(e) => updateScheduleItem(index, 'title', e.target.value)}
                          disabled={loading}
                          className="sm:col-span-2"
                        />
                      </div>
                      <Textarea
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateScheduleItem(index, 'description', e.target.value)}
                        rows={2}
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No schedule items. Click "Add Item" to create one.
                </p>
              )}
            </TabsContent>

            {/* Important Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base">Important Information Sections</Label>
                <Button
                  type="button"
                  onClick={addImportantInfo}
                  size="sm"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {eventInfo.important_info && eventInfo.important_info.length > 0 ? (
                <div className="space-y-4">
                  {eventInfo.important_info.map((item, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <Input
                          placeholder="Section Title"
                          value={item.title}
                          onChange={(e) => updateImportantInfo(index, 'title', e.target.value)}
                          disabled={loading}
                          className="flex-1 font-semibold"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImportantInfo(index)}
                          disabled={loading}
                          className="ml-2"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Content for this section"
                        value={item.content}
                        onChange={(e) => updateImportantInfo(index, 'content', e.target.value)}
                        rows={3}
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No info sections. Click "Add Section" to create one.
                </p>
              )}
            </TabsContent>
          </Tabs>

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save All Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

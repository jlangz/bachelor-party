'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Trophy, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Activity, ActivityTypeCategory } from '@/lib/supabase';

interface ActivitiesManagerProps {
  userId: string;
}

export function ActivitiesManager({ userId }: ActivitiesManagerProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activity_type: 'participatory' as ActivityTypeCategory,
    participation_options: 'participating,watching,not_attending',
  });

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setFetching(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: formData.name,
          description: formData.description,
          activity_type: formData.activity_type,
          participation_options: formData.participation_options
            .split(',')
            .map((opt) => opt.trim())
            .filter((opt) => opt),
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        setActivities([...activities, newActivity]);
        toast.success('Activity added successfully');
        setFormData({
          name: '',
          description: '',
          activity_type: 'participatory',
          participation_options: 'participating,watching,not_attending',
        });
        setShowAddForm(false);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to add activity');
      }
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (activity: Activity) => {
    setLoading(true);

    try {
      const response = await fetch(`/api/activities/${activity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...activity,
        }),
      });

      if (response.ok) {
        const updatedActivity = await response.json();
        setActivities(
          activities.map((a) => (a.id === updatedActivity.id ? updatedActivity : a))
        );
        toast.success('Activity updated successfully');
        setEditingId(null);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update activity');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/activities/${id}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setActivities(activities.filter((a) => a.id !== id));
        toast.success('Activity deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Activities Management
            </CardTitle>
            <CardDescription>
              Add, edit, or remove party activities
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            variant={showAddForm ? 'outline' : 'default'}
          >
            {showAddForm ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="space-y-4 border border-border rounded-lg p-4">
            <div className="space-y-2">
              <Label htmlFor="name">Activity Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Poker Night"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the activity"
                rows={2}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_type">Activity Type</Label>
              <Select
                value={formData.activity_type}
                onValueChange={(value: ActivityTypeCategory) =>
                  setFormData({ ...formData, activity_type: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participatory">Participatory</SelectItem>
                  <SelectItem value="spectator">Spectator</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="participation_options">
                Participation Options (comma-separated)
              </Label>
              <Input
                id="participation_options"
                value={formData.participation_options}
                onChange={(e) =>
                  setFormData({ ...formData, participation_options: e.target.value })
                }
                placeholder="participating,watching,not_attending"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                These will be the choices users can select
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Adding...' : 'Add Activity'}
            </Button>
          </form>
        )}

        {/* Activities List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Existing Activities ({activities.length})
          </h3>

          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No activities yet. Add one to get started!
            </p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="border border-border rounded-lg p-4">
                {editingId === activity.id ? (
                  <div className="space-y-3">
                    <Input
                      value={activity.name}
                      onChange={(e) =>
                        setActivities(
                          activities.map((a) =>
                            a.id === activity.id ? { ...a, name: e.target.value } : a
                          )
                        )
                      }
                      disabled={loading}
                    />
                    <Textarea
                      value={activity.description || ''}
                      onChange={(e) =>
                        setActivities(
                          activities.map((a) =>
                            a.id === activity.id ? { ...a, description: e.target.value } : a
                          )
                        )
                      }
                      rows={2}
                      disabled={loading}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdate(activity)}
                        disabled={loading}
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{activity.name}</h4>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="capitalize">{activity.activity_type}</span>
                        <span>•</span>
                        <span>
                          Options: {activity.participation_options.join(', ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setEditingId(activity.id)}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(activity.id)}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

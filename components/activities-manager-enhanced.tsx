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
import { Trophy, Plus, Edit2, Trash2, Save, X, DollarSign, MapPin, Clock } from 'lucide-react';
import { Activity, ActivityTypeCategory } from '@/lib/supabase';
import { IconSelector } from '@/components/icon-selector';
import * as Icons from 'lucide-react';

interface ActivitiesManagerProps {
  userId: string;
}

type ActivityFormData = {
  name: string;
  description: string;
  activity_type: ActivityTypeCategory;
  participation_options: string;
  icon: string;
  when_description: string;
  when_datetime: string;
  location: string;
  cost: string;
  cost_description: string;
  additional_notes: string;
};

export function ActivitiesManagerEnhanced({ userId }: ActivitiesManagerProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const initialFormData: ActivityFormData = {
    name: '',
    description: '',
    activity_type: 'participatory',
    participation_options: 'participating,watching,not_attending',
    icon: 'Trophy',
    when_description: '',
    when_datetime: '',
    location: '',
    cost: '',
    cost_description: '',
    additional_notes: '',
  };

  const [formData, setFormData] = useState<ActivityFormData>(initialFormData);

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
          icon: formData.icon,
          when_description: formData.when_description || null,
          when_datetime: formData.when_datetime || null,
          location: formData.location || null,
          cost: formData.cost ? parseFloat(formData.cost) : null,
          cost_description: formData.cost_description || null,
          additional_notes: formData.additional_notes || null,
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        setActivities([...activities, newActivity]);
        toast.success('Activity added successfully');
        setFormData(initialFormData);
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
              Create rich, detailed activities with icons, timing, costs, and more
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
          <form onSubmit={handleAdd} className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="icon">Icon *</Label>
                <IconSelector
                  value={formData.icon}
                  onChange={(icon) => setFormData({ ...formData, icon })}
                  disabled={loading}
                />
              </div>

              {/* Name */}
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
            </div>

            {/* Description */}
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

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Activity Type */}
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

              {/* Participation Options */}
              <div className="space-y-2">
                <Label htmlFor="participation_options">Answer Options (comma-separated)</Label>
                <Input
                  id="participation_options"
                  value={formData.participation_options}
                  onChange={(e) =>
                    setFormData({ ...formData, participation_options: e.target.value })
                  }
                  placeholder="participating,watching,not_attending"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* When (Description) */}
              <div className="space-y-2">
                <Label htmlFor="when_description" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  When
                </Label>
                <Input
                  id="when_description"
                  value={formData.when_description}
                  onChange={(e) => setFormData({ ...formData, when_description: e.target.value })}
                  placeholder="e.g., Saturday Morning"
                  disabled={loading}
                />
              </div>

              {/* When (DateTime) */}
              <div className="space-y-2">
                <Label htmlFor="when_datetime">Specific Date/Time (optional)</Label>
                <Input
                  id="when_datetime"
                  type="datetime-local"
                  value={formData.when_datetime}
                  onChange={(e) => setFormData({ ...formData, when_datetime: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Downtown Sports Bar"
                disabled={loading}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Cost (Number) */}
              <div className="space-y-2">
                <Label htmlFor="cost" className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Cost Per Person
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="50.00"
                  disabled={loading}
                />
              </div>

              {/* Cost Description */}
              <div className="space-y-2">
                <Label htmlFor="cost_description">Cost Details</Label>
                <Input
                  id="cost_description"
                  value={formData.cost_description}
                  onChange={(e) => setFormData({ ...formData, cost_description: e.target.value })}
                  placeholder="e.g., includes ammo"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="additional_notes">Additional Notes</Label>
              <Textarea
                id="additional_notes"
                value={formData.additional_notes}
                onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                placeholder="Any extra information guests should know"
                rows={2}
                disabled={loading}
              />
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
            activities.map((activity) => {
              const IconComponent = (Icons as any)[activity.icon] || Icons.Trophy;

              return (
                <div key={activity.id} className="border border-border rounded-lg p-4">
                  {editingId === activity.id ? (
                    <div className="space-y-4 bg-muted/20 p-4 rounded-lg">
                      {/* Full edit form with all fields */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <IconSelector
                            value={activity.icon}
                            onChange={(icon) =>
                              setActivities(
                                activities.map((a) =>
                                  a.id === activity.id ? { ...a, icon } : a
                                )
                              )
                            }
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Activity Name</Label>
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
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
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
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Activity Type</Label>
                          <Select
                            value={activity.activity_type}
                            onValueChange={(value: ActivityTypeCategory) =>
                              setActivities(
                                activities.map((a) =>
                                  a.id === activity.id ? { ...a, activity_type: value } : a
                                )
                              )
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
                          <Label>Answer Options</Label>
                          <Input
                            value={activity.participation_options.join(',')}
                            onChange={(e) =>
                              setActivities(
                                activities.map((a) =>
                                  a.id === activity.id
                                    ? { ...a, participation_options: e.target.value.split(',').map(s => s.trim()) }
                                    : a
                                )
                              )
                            }
                            disabled={loading}
                            placeholder="participating,watching,not_attending"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            When
                          </Label>
                          <Input
                            placeholder="e.g., Saturday Morning"
                            value={activity.when_description || ''}
                            onChange={(e) =>
                              setActivities(
                                activities.map((a) =>
                                  a.id === activity.id ? { ...a, when_description: e.target.value } : a
                                )
                              )
                            }
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Specific Date/Time</Label>
                          <Input
                            type="datetime-local"
                            value={activity.when_datetime || ''}
                            onChange={(e) =>
                              setActivities(
                                activities.map((a) =>
                                  a.id === activity.id ? { ...a, when_datetime: e.target.value } : a
                                )
                              )
                            }
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Location
                        </Label>
                        <Input
                          placeholder="e.g., Downtown Sports Bar"
                          value={activity.location || ''}
                          onChange={(e) =>
                            setActivities(
                              activities.map((a) =>
                                a.id === activity.id ? { ...a, location: e.target.value } : a
                              )
                            )
                          }
                          disabled={loading}
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Cost Per Person
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50.00"
                            value={activity.cost || ''}
                            onChange={(e) =>
                              setActivities(
                                activities.map((a) =>
                                  a.id === activity.id
                                    ? { ...a, cost: e.target.value ? parseFloat(e.target.value) : null }
                                    : a
                                )
                              )
                            }
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cost Details</Label>
                          <Input
                            placeholder="e.g., includes ammo"
                            value={activity.cost_description || ''}
                            onChange={(e) =>
                              setActivities(
                                activities.map((a) =>
                                  a.id === activity.id ? { ...a, cost_description: e.target.value } : a
                                )
                              )
                            }
                            disabled={loading}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Additional Notes</Label>
                        <Textarea
                          placeholder="Any extra information"
                          value={activity.additional_notes || ''}
                          onChange={(e) =>
                            setActivities(
                              activities.map((a) =>
                                a.id === activity.id ? { ...a, additional_notes: e.target.value } : a
                              )
                            )
                          }
                          rows={2}
                          disabled={loading}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleUpdate(activity)}
                          disabled={loading}
                          size="sm"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{activity.name}</h4>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-3 text-xs">
                          {activity.when_description && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
                              <Clock className="w-3 h-3" />
                              {activity.when_description}
                            </span>
                          )}
                          {activity.location && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
                              <MapPin className="w-3 h-3" />
                              {activity.location}
                            </span>
                          )}
                          {activity.cost_description && (
                            <span className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
                              <DollarSign className="w-3 h-3" />
                              {activity.cost_description}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                          <span className="capitalize">{activity.activity_type}</span>
                          <span>•</span>
                          <span>Options: {activity.participation_options.join(', ')}</span>
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
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

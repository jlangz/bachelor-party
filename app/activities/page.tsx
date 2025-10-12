'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, Activity } from '@/lib/supabase';
import { toast } from 'sonner';
import { DollarSign, Clock, Save, MapPin, Info } from 'lucide-react';
import * as Icons from 'lucide-react';

type ParticipationLevel = string;

interface ActivityResponse {
  activity_id: string;
  user_id: string;
  participation_level: ParticipationLevel;
}

export default function ActivitiesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userResponses, setUserResponses] = useState<Record<string, ParticipationLevel>>({});
  const [responseCounts, setResponseCounts] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;

    try {
      // Fetch all active activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (activitiesError) {
        console.error('Error loading activities:', activitiesError);
        toast.error('Failed to load activities');
        return;
      }

      setActivities(activitiesData || []);

      // Fetch user's existing responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('activity_signups')
        .select('*')
        .eq('user_id', user.id);

      if (responsesError) {
        console.error('Error loading responses:', responsesError);
        console.error('Response error details:', JSON.stringify(responsesError, null, 2));
      }

      if (responsesData) {
        const responsesMap: Record<string, ParticipationLevel> = {};
        responsesData.forEach((response: ActivityResponse) => {
          responsesMap[response.activity_id] = response.participation_level;
        });
        setUserResponses(responsesMap);
      }

      // Load response counts for all activities
      if (activitiesData) {
        await loadResponseCounts(activitiesData);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResponseCounts = async (activitiesList: Activity[]) => {
    try {
      const counts: Record<string, Record<string, number>> = {};

      for (const activity of activitiesList) {
        const { data: responsesData } = await supabase
          .from('activity_signups')
          .select('participation_level')
          .eq('activity_id', activity.id)
          .neq('participation_level', 'not_attending');

        if (responsesData) {
          const activityCounts: Record<string, number> = {};
          responsesData.forEach((response: { participation_level: string }) => {
            activityCounts[response.participation_level] =
              (activityCounts[response.participation_level] || 0) + 1;
          });
          counts[activity.id] = activityCounts;
        }
      }

      setResponseCounts(counts);
    } catch (error) {
      console.error('Error loading response counts:', error);
    }
  };

  const handleResponseChange = (activityId: string, participationLevel: ParticipationLevel) => {
    setUserResponses(prev => ({
      ...prev,
      [activityId]: participationLevel
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      // Save each activity response individually
      for (const activity of activities) {
        const participationLevel = userResponses[activity.id] || 'not_attending';

        // First, try to find existing signup for this user and activity
        const { data: existing } = await supabase
          .from('activity_signups')
          .select('id')
          .eq('user_id', user.id)
          .eq('activity_id', activity.id)
          .maybeSingle();

        if (existing) {
          // Update existing record
          const { error: updateError } = await supabase
            .from('activity_signups')
            .update({
              participation_level: participationLevel,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (updateError) {
            console.error('Error updating activity response:', updateError);
            toast.error(`Failed to update ${activity.name}`);
            return;
          }
        } else {
          // Insert new record
          const { error: insertError } = await supabase
            .from('activity_signups')
            .insert({
              user_id: user.id,
              activity_id: activity.id,
              participation_level: participationLevel,
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('Error inserting activity response:', insertError);
            toast.error(`Failed to save ${activity.name}: ${insertError.message || 'Unknown error'}`);
            return;
          }
        }
      }

      toast.success('Activity responses saved successfully!');
      loadActivities();
    } catch (error) {
      console.error('Error saving activity responses:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
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

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Activities</h1>
          <p className="text-muted-foreground text-lg">
            Sign up for activities so we can book tickets and spots
          </p>
        </div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No activities available yet.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Activity Cards */}
            {activities.map((activity) => {
              const IconComponent = (Icons as any)[activity.icon] || Icons.Calendar;
              const currentResponse = userResponses[activity.id] || 'not_attending';
              const counts = responseCounts[activity.id] || {};

              return (
                <Card key={activity.id} className="mb-6 border-primary/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <IconComponent className="w-6 h-6 text-primary" />
                      {activity.name}
                    </CardTitle>
                    {activity.description && (
                      <CardDescription className="text-base">
                        {activity.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Info Banner */}
                    <div className="grid sm:grid-cols-3 gap-3 mb-4">
                      {activity.when_description && (
                        <div className="bg-accent/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">When</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{activity.when_description}</p>
                          {activity.when_datetime && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.when_datetime).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          )}
                        </div>
                      )}

                      {(activity.cost || activity.cost_description) && (
                        <div className="bg-accent/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Cost</span>
                          </div>
                          {activity.cost && (
                            <p className="text-xs text-muted-foreground">
                              ${activity.cost.toFixed(2)} per person
                            </p>
                          )}
                          {activity.cost_description && (
                            <p className="text-xs text-muted-foreground">{activity.cost_description}</p>
                          )}
                        </div>
                      )}

                      {activity.location && (
                        <div className="bg-accent/50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Location</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{activity.location}</p>
                        </div>
                      )}
                    </div>

                    {/* Response Counts */}
                    {Object.keys(counts).length > 0 && (
                      <div className="bg-accent/30 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">Current RSVPs</span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {Object.entries(counts).map(([level, count]) => {
                            const option = activity.participation_options.find(opt => opt.id === level);
                            const optionText = option ? (typeof option === 'string' ? option : (option.text || option.id)) : level;
                            const label = optionText.replace('_', ' ');
                            return (
                              <span key={level} className="px-2 py-1 bg-muted rounded">
                                {count} {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Options */}
                    <div className="space-y-2">
                      {activity.participation_options.map((option) => {
                        const isSelected = currentResponse === option.id;
                        // Handle both string and object options, with safety check for undefined text
                        const optionText = typeof option === 'string' ? option : (option.text || option.id || '');
                        const optionLabel = optionText
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');

                        return (
                          <button
                            key={option.id}
                            onClick={() => handleResponseChange(activity.id, option.id)}
                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-primary bg-primary/10 ring-2 ring-primary'
                                : 'border-border hover:border-primary/50 bg-card'
                            }`}
                          >
                            <div className="font-semibold">{optionLabel}</div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Additional Notes */}
                    {activity.additional_notes && (
                      <div className="mt-4 p-4 bg-primary/10 border border-primary/50 rounded-lg">
                        <p className="text-sm">
                          <strong>Note:</strong> {activity.additional_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Save Button */}
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Activity Responses'}
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

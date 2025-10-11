'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, ActivitySignup, ActivityType, ParticipationLevel } from '@/lib/supabase';
import { toast } from 'sonner';
import { Target, Theater, Users, DollarSign, Clock, Save } from 'lucide-react';

export default function ActivitiesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<ActivitySignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local state for selections
  const [shootingLevel, setShootingLevel] = useState<ParticipationLevel>('not_attending');
  const [showLevel, setShowLevel] = useState<ParticipationLevel>('not_attending');

  // Counts
  const [shootingCount, setShootingCount] = useState({ participating: 0, watching: 0 });
  const [showCount, setShowCount] = useState({ participating: 0 });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadActivities();
      loadCounts();
    }
  }, [user]);

  const loadActivities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('activity_signups')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading activities:', error);
        toast.error('Failed to load your activity signups');
      }

      if (data) {
        setActivities(data);

        // Set local state from loaded data
        const shooting = data.find((a) => a.activity_type === 'shooting');
        const show = data.find((a) => a.activity_type === 'show');

        if (shooting) setShootingLevel(shooting.participation_level);
        if (show) setShowLevel(show.participation_level);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async () => {
    try {
      // Shooting counts
      const { data: shootingData } = await supabase
        .from('activity_signups')
        .select('participation_level')
        .eq('activity_type', 'shooting')
        .neq('participation_level', 'not_attending');

      if (shootingData) {
        const counts = shootingData.reduce(
          (acc, item) => {
            if (item.participation_level === 'participating') acc.participating++;
            if (item.participation_level === 'watching') acc.watching++;
            return acc;
          },
          { participating: 0, watching: 0 }
        );
        setShootingCount(counts);
      }

      // Show counts
      const { data: showData } = await supabase
        .from('activity_signups')
        .select('participation_level')
        .eq('activity_type', 'show')
        .eq('participation_level', 'participating');

      if (showData) {
        setShowCount({ participating: showData.length });
      }
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const updates = [
        {
          user_id: user.id,
          activity_type: 'shooting' as ActivityType,
          participation_level: shootingLevel,
          updated_at: new Date().toISOString(),
        },
        {
          user_id: user.id,
          activity_type: 'show' as ActivityType,
          participation_level: showLevel,
          updated_at: new Date().toISOString(),
        },
      ];

      const { error } = await supabase
        .from('activity_signups')
        .upsert(updates, { onConflict: 'user_id,activity_type' });

      if (error) {
        console.error('Error saving activities:', error);
        toast.error('Failed to save your activity signups');
      } else {
        toast.success('Activity signups saved successfully!');
        loadActivities();
        loadCounts();
      }
    } catch (error) {
      console.error('Error saving activities:', error);
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

  const shootingOptions: { value: ParticipationLevel; label: string; description: string }[] = [
    { value: 'participating', label: 'Count Me In!', description: "I want to shoot ($100-150)" },
    { value: 'watching', label: 'Just Watching', description: "I'll come along but not shoot (free)" },
    { value: 'not_attending', label: 'Not Attending', description: "I'll skip the shooting range" },
  ];

  const showOptions: { value: ParticipationLevel; label: string; description: string }[] = [
    { value: 'participating', label: "I'm In!", description: "Get me a ticket ($50-80)" },
    { value: 'not_attending', label: 'Not Attending', description: "I'll skip the show" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Activities</h1>
          <p className="text-muted-foreground text-lg">
            Sign up for Saturday&apos;s activities so we can book tickets and spots
          </p>
        </div>

        {/* Shooting Range */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Target className="w-6 h-6 text-primary" />
              Shooting Range
            </CardTitle>
            <CardDescription className="text-base">
              Saturday morning - Breakfast at the house, then we&apos;re going shooting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info Banner */}
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-accent/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">When</span>
                </div>
                <p className="text-xs text-muted-foreground">Saturday Morning</p>
              </div>
              <div className="bg-accent/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Cost</span>
                </div>
                <p className="text-xs text-muted-foreground">$100-150 to shoot</p>
              </div>
              <div className="bg-accent/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Signed Up</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {shootingCount.participating} shooting, {shootingCount.watching} watching
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {shootingOptions.map((option) => {
                const isSelected = shootingLevel === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setShootingLevel(option.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <div className="font-semibold mb-1">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Empire Strips Back Show */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Theater className="w-6 h-6 text-primary" />
              The Empire Strips Back
            </CardTitle>
            <CardDescription className="text-base">
              Saturday evening - Star Wars burlesque parody show (it&apos;s legendary!)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info Banner */}
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-accent/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">When</span>
                </div>
                <p className="text-xs text-muted-foreground">Saturday Evening</p>
              </div>
              <div className="bg-accent/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Cost</span>
                </div>
                <p className="text-xs text-muted-foreground">$50-80 per ticket</p>
              </div>
              <div className="bg-accent/50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Signed Up</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {showCount.participating} attending
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {showOptions.map((option) => {
                const isSelected = showLevel === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setShowLevel(option.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <div className="font-semibold mb-1">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-4 bg-primary/10 border border-primary/50 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> We&apos;ll try to book seats together, so let us know ASAP if you&apos;re in!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Activity Signups'}
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

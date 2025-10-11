'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase, RSVP, AttendanceStatus, SleepingArrangement, EventInfo } from '@/lib/supabase';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, HelpCircle, Bed, Save } from 'lucide-react';

export default function RSVPPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rsvp, setRsvp] = useState<RSVP | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [houseBedsClaimed, setHouseBedsClaimed] = useState(0);

  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('maybe');
  const [sleepingArrangement, setSleepingArrangement] = useState<SleepingArrangement | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadRSVP();
      loadEventInfo();
    }
  }, [user]);

  const loadEventInfo = async () => {
    try {
      // Fetch event info
      const response = await fetch('/api/event-info');
      if (response.ok) {
        const data = await response.json();
        setEventInfo(data);
      }

      // Count how many beds are claimed
      const { data: rsvps, error } = await supabase
        .from('rsvps')
        .select('sleeping_arrangement')
        .eq('sleeping_arrangement', 'house_bed');

      if (!error && rsvps) {
        setHouseBedsClaimed(rsvps.length);
      }
    } catch (error) {
      console.error('Error loading event info:', error);
    }
  };

  const loadRSVP = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading RSVP:', error);
        toast.error('Failed to load your RSVP');
      }

      if (data) {
        setRsvp(data);
        setAttendanceStatus(data.attendance_status);
        setSleepingArrangement(data.sleeping_arrangement);
        setNotes(data.notes || '');
      }
    } catch (error) {
      console.error('Error loading RSVP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const rsvpData = {
        user_id: user.id,
        attendance_status: attendanceStatus,
        sleeping_arrangement: sleepingArrangement,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('rsvps')
        .upsert(rsvpData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving RSVP:', error);
        toast.error('Failed to save your RSVP');
      } else {
        toast.success('RSVP saved successfully!');
        loadRSVP();
      }
    } catch (error) {
      console.error('Error saving RSVP:', error);
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

  const attendanceOptions: { value: AttendanceStatus; label: string; icon: any; color: string }[] = [
    { value: 'yes', label: "I'm Coming!", icon: CheckCircle2, color: 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20' },
    { value: 'maybe', label: 'Maybe', icon: HelpCircle, color: 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20' },
    { value: 'no', label: "Can't Make It", icon: XCircle, color: 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20' },
  ];

  const houseBedsFull = eventInfo && houseBedsClaimed >= eventInfo.house_beds_total;
  const currentUserHasHouseBed = rsvp?.sleeping_arrangement === 'house_bed';
  const canSelectHouseBed = !houseBedsFull || currentUserHasHouseBed;

  const totalBeds = eventInfo?.house_beds_total || 11;
  const houseBedDescription = canSelectHouseBed
    ? `I want one of the ${totalBeds} beds at main AirBnB (${houseBedsClaimed} of ${totalBeds} claimed)`
    : `All ${totalBeds} beds are claimed - please choose another option`;

  const sleepingOptions: { value: SleepingArrangement; label: string; description: string; disabled?: boolean }[] = [
    { value: 'house_bed', label: 'House Bed', description: houseBedDescription, disabled: !canSelectHouseBed },
    { value: 'own_place', label: 'Own Accommodation', description: "I'll arrange my own hotel or Airbnb" },
    { value: 'not_staying', label: 'Not Staying Overnight', description: "I'm just joining for the events" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">RSVP</h1>
          <p className="text-muted-foreground text-lg">
            Let us know if you&apos;re coming and where you&apos;ll be staying
          </p>
        </div>

        {/* Attendance Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Will you be attending?</CardTitle>
            <CardDescription>
              Select your attendance status for the bachelor party weekend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {attendanceOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = attendanceStatus === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setAttendanceStatus(option.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                    isSelected
                      ? `${option.color} ring-2 ring-primary`
                      : 'border-border hover:border-primary/50 bg-card'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-semibold ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Sleeping Arrangement */}
        {attendanceStatus === 'yes' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="w-5 h-5" />
                Sleeping Arrangement
              </CardTitle>
              <CardDescription>
                Where will you be staying during the weekend?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {sleepingOptions.map((option) => {
                const isSelected = sleepingArrangement === option.value;
                const isDisabled = option.disabled;

                return (
                  <button
                    key={option.value}
                    onClick={() => !isDisabled && setSleepingArrangement(option.value)}
                    disabled={isDisabled}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      isDisabled
                        ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary'
                        : 'border-border hover:border-primary/50 bg-card'
                    }`}
                  >
                    <div className="font-semibold mb-1">
                      {option.label}
                      {isDisabled && ' (Unavailable)'}
                    </div>
                    <div className="text-sm text-muted-foreground">{option.description}</div>
                  </button>
                );
              })}

              {sleepingArrangement === 'house_bed' && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                  <p className="text-sm text-yellow-200">
                    <strong>Note:</strong> AirBnB is mostly filled by the groom, and groomsmen. If you want a bed here, confirm with Jakob.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Additional Notes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>
              Any notes for the groom/organizers? You can also let us know where you&apos;ll be staying, or other details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Let us know if you have any special requirements or questions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={saving || (attendanceStatus === 'yes' && !sleepingArrangement)}
            className="flex-1"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save RSVP'}
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            size="lg"
          >
            Cancel
          </Button>
        </div>

        {attendanceStatus === 'yes' && !sleepingArrangement && (
          <p className="text-sm text-destructive mt-2 text-center">
            Please select a sleeping arrangement before saving
          </p>
        )}
      </div>
    </div>
  );
}

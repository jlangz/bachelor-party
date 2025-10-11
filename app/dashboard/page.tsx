'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, RSVP, ActivitySignup, EventInfo } from '@/lib/supabase';
import { Calendar, Bed, Trophy, Info, ArrowRight, MapPin, Clock, User, Users } from 'lucide-react';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rsvp, setRsvp] = useState<RSVP | null>(null);
  const [activities, setActivities] = useState<ActivitySignup[]>([]);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [houseBedsClaimed, setHouseBedsClaimed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserData();
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

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load RSVP
      const { data: rsvpData } = await supabase
        .from('rsvps')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (rsvpData) {
        setRsvp(rsvpData);
      }

      // Load activity signups
      const { data: activitiesData } = await supabase
        .from('activity_signups')
        .select('*')
        .eq('user_id', user.id);

      if (activitiesData) {
        setActivities(activitiesData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
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

  const getAttendanceStatus = () => {
    if (!rsvp) return { text: 'Not Set', color: 'text-muted-foreground' };
    switch (rsvp.attendance_status) {
      case 'yes':
        return { text: 'Attending', color: 'text-green-500' };
      case 'no':
        return { text: 'Not Attending', color: 'text-red-500' };
      case 'maybe':
        return { text: 'Maybe', color: 'text-yellow-500' };
      default:
        return { text: 'Not Set', color: 'text-muted-foreground' };
    }
  };

  const getSleepingArrangement = () => {
    if (!rsvp?.sleeping_arrangement) return 'Not Set';
    switch (rsvp.sleeping_arrangement) {
      case 'house_bed':
        return 'House Bed';
      case 'own_place':
        return 'Own Accommodation';
      case 'not_staying':
        return 'Not Staying';
      default:
        return 'Not Set';
    }
  };

  const getActivityStatus = (type: 'shooting' | 'show') => {
    const activity = activities.find((a) => a.activity_type === type);
    if (!activity || activity.participation_level === 'not_attending') return 'Not Signed Up';
    if (activity.participation_level === 'participating') return 'Participating';
    if (activity.participation_level === 'watching') return 'Watching';
    return 'Not Signed Up';
  };

  const attendanceStatus = getAttendanceStatus();

  // Calculate days until event
  const eventStartDate = eventInfo?.event_date_start ? new Date(eventInfo.event_date_start) : new Date('2025-11-14');
  const today = new Date();
  const daysUntil = Math.ceil((eventStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start || !end) return 'Dates TBA';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome, {user.name}!</h1>
          <p className="text-muted-foreground text-lg">
            {eventInfo?.short_description || `Get ready for an unforgettable weekend at ${eventInfo?.location_name || 'the event'}`}
          </p>
        </div>

        {/* Countdown */}
        <Card className="mb-8 border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Days Until {eventInfo?.event_name || 'Event'}</p>
                  <p className="text-3xl font-bold text-primary">{daysUntil > 0 ? daysUntil : 'Today!'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Event Date</p>
                <p className="text-lg font-semibold">
                  {formatDateRange(eventInfo?.event_date_start || null, eventInfo?.event_date_end || null)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* RSVP Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RSVP Status</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${attendanceStatus.color}`}>
                {attendanceStatus.text}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Click to update your response
              </p>
              <Link href="/rsvp">
                <Button className="w-full mt-4" size="sm">
                  Update RSVP <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Sleeping Arrangement */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sleeping</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getSleepingArrangement()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {houseBedsClaimed} of {eventInfo?.house_beds_total || 11} house beds claimed
              </p>
              <Link href="/rsvp">
                <Button className="w-full mt-4" size="sm" variant="outline">
                  Update Choice <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Activities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Shooting Range</p>
                  <p className="text-xs text-muted-foreground">{getActivityStatus('shooting')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Empire Strips Back</p>
                  <p className="text-xs text-muted-foreground">{getActivityStatus('show')}</p>
                </div>
              </div>
              <Link href="/activities">
                <Button className="w-full mt-4" size="sm" variant="outline">
                  Manage Activities <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Event Info */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Event Information
              </CardTitle>
              <CardDescription>
                Full schedule, address, and important details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {eventInfo?.airbnb_address || eventInfo?.location_address ? (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                    <div>
                      {eventInfo.airbnb_house_name && (
                        <p className="text-sm font-medium">{eventInfo.airbnb_house_name}</p>
                      )}
                      <p className="text-sm font-medium">{eventInfo.airbnb_address || eventInfo.location_address}</p>
                      {eventInfo.location_name && (
                        <p className="text-xs text-muted-foreground">{eventInfo.location_name}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Location TBA</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatDateRange(eventInfo?.event_date_start || null, eventInfo?.event_date_end || null)}
                    </p>
                    {eventInfo?.event_date_start_time && eventInfo?.event_date_end_time && (
                      <p className="text-xs text-muted-foreground">
                        {eventInfo.event_date_start_time} to {eventInfo.event_date_end_time}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Link href="/info">
                <Button className="w-full">
                  View Full Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle>Need to Make Changes?</CardTitle>
              <CardDescription>
                Update your RSVP, sleeping arrangements, or activity signups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/rsvp">
                <Button className="w-full" variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Update RSVP
                </Button>
              </Link>
              <Link href="/activities">
                <Button className="w-full" variant="outline">
                  <Trophy className="mr-2 h-4 w-4" />
                  Manage Activities
                </Button>
              </Link>
              <Link href="/profile">
                <Button className="w-full" variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Directory */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Attendee Directory
              </CardTitle>
              <CardDescription>
                View contact info and details for all guests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Connect with guests</p>
                    <p className="text-xs text-muted-foreground">See who's coming and how to reach them</p>
                  </div>
                </div>
              </div>
              <Link href="/directory">
                <Button className="w-full">
                  View Directory <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

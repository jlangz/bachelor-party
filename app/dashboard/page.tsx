'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase, RSVP, EventInfo } from '@/lib/supabase';
import * as Icons from 'lucide-react';

const { Calendar, Info, ArrowRight, MapPin, Clock, User, Users, Target, Trophy } = Icons;

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [rsvp, setRsvp] = useState<RSVP | null>(null);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [houseBedsClaimed, setHouseBedsClaimed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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

  // Live countdown timer
  useEffect(() => {
    const calculateCountdown = () => {
      const eventStartDate = eventInfo?.event_date_start
        ? new Date(eventInfo.event_date_start)
        : new Date('2025-11-14T00:00:00');

      const now = new Date();
      const difference = eventStartDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({ days, hours, minutes, seconds });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [eventInfo]);

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

  const attendanceStatus = getAttendanceStatus();

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
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="text-center sm:text-left">
                  <p className="text-sm font-medium">Countdown to {eventInfo?.event_name || 'Vegas'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateRange(eventInfo?.event_date_start || null, eventInfo?.event_date_end || null)}
                  </p>
                </div>
              </div>

              {countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0 ? (
                <p className="text-xl sm:text-2xl font-bold text-primary">It&apos;s Party Time! 🎉</p>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="text-center min-w-[2.5rem] sm:min-w-[3rem]">
                    <div className="text-xl sm:text-2xl font-bold text-primary tabular-nums">{countdown.days}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">days</div>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-muted-foreground">:</div>
                  <div className="text-center min-w-[2.5rem] sm:min-w-[3rem]">
                    <div className="text-xl sm:text-2xl font-bold text-primary tabular-nums">{countdown.hours.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">hrs</div>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-muted-foreground">:</div>
                  <div className="text-center min-w-[2.5rem] sm:min-w-[3rem]">
                    <div className="text-xl sm:text-2xl font-bold text-primary tabular-nums">{countdown.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">min</div>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-muted-foreground">:</div>
                  <div className="text-center min-w-[2.5rem] sm:min-w-[3rem]">
                    <div className="text-xl sm:text-2xl font-bold text-primary tabular-nums">{countdown.seconds.toString().padStart(2, '0')}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">sec</div>
                  </div>
                </div>
              )}
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
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Sleeping</p>
                <p className="text-sm font-semibold">{getSleepingArrangement()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {houseBedsClaimed} of {eventInfo?.house_beds_total || 11} house beds claimed
                </p>
              </div>
              <Link href="/rsvp">
                <Button className="w-full mt-4" size="sm">
                  Update RSVP <ArrowRight className="ml-2 h-4 w-4" />
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
              <div className="text-2xl font-bold mb-1">Sign Up!</div>
              <p className="text-xs text-muted-foreground mb-4">
                Shooting range, shows, and more!
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Select the activities you want to join! If there are some you wanna skip, go ahead and mark no, and reach out to someone else to do something on your own.
              </p>
              <Link href="/activities">
                <Button className="w-full" size="sm" variant="outline">
                  Manage Activities <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Places */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Places to Go</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">Las Vegas Hotspots</div>
              <p className="text-xs text-muted-foreground mb-4">
                Recommend some stuff for us!
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Not everything is set in stone yet. If you have any good ideas add your suggestions here!
              </p>
              <Link href="/recommendations">
                <Button className="w-full" size="sm" variant="outline">
                  Browse Places <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Middle Row - Event Info and Directory */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
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
                    <p className="text-xs text-muted-foreground">See who&apos;s coming and how to reach them</p>
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

        {/* Bottom Row - Betting Pool and Profile */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Predictions Game */}
          <Card className="hover:border-primary/50 transition-colors border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Betting Pool
              </CardTitle>
              <CardDescription>
                Predict what will happen at the party and compete!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Place your bets</p>
                    <p className="text-xs text-muted-foreground">Make predictions and climb the leaderboard</p>
                  </div>
                </div>
              </div>
              <Link href="/predictions">
                <Button className="w-full">
                  View Predictions <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Edit Profile */}
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Your Profile
              </CardTitle>
              <CardDescription>
                Update your contact info and personal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Manage your account</p>
                    <p className="text-xs text-muted-foreground">Edit name, phone, email, and more</p>
                  </div>
                </div>
              </div>
              <Link href="/profile">
                <Button className="w-full" variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

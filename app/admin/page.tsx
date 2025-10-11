'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase, User, RSVP, ActivitySignup } from '@/lib/supabase';
import { displayPhoneNumber } from '@/lib/auth-utils';
import { toast } from 'sonner';
import { Shield, Users, Bed, Trophy, Download, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InvitedUsersManager } from '@/components/invited-users-manager';
import { EventInfoEditorWYSIWYG } from '@/components/event-info-editor-wysiwyg';
import { ActivitiesManagerEnhanced } from '@/components/activities-manager-enhanced';

type UserWithDetails = User & {
  rsvp?: RSVP;
  activities?: ActivitySignup[];
};

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [users, setUsers] = useState<UserWithDetails[]>([]);

  const loadAllData = useCallback(async () => {
    setLoading(true);

    try {
      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (usersError) {
        console.error('Error loading users:', usersError);
        toast.error('Failed to load users');
        return;
      }

      // Load all RSVPs
      const { data: rsvpsData, error: rsvpsError } = await supabase
        .from('rsvps')
        .select('*');

      if (rsvpsError) {
        console.error('Error loading RSVPs:', rsvpsError);
      }

      // Load all activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activity_signups')
        .select('*');

      if (activitiesError) {
        console.error('Error loading activities:', activitiesError);
      }

      // Combine data
      const usersWithDetails: UserWithDetails[] = (usersData || []).map((u) => ({
        ...u,
        rsvp: rsvpsData?.find((r) => r.user_id === u.id),
        activities: activitiesData?.filter((a) => a.user_id === u.id) || [],
      }));

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAuthentication = useCallback(async () => {
    setCheckingAuth(true);
    try {
      const response = await fetch('/api/admin/verify');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          loadAllData();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setLoading(false);
    } finally {
      setCheckingAuth(false);
    }
  }, [loadAllData]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    } else if (!isLoading && user && user.role !== 'admin') {
      toast.error('You do not have admin access');
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Check if already authenticated via server session
    checkAuthentication();
  }, [checkAuthentication]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingAuth(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, userId: user?.id }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        toast.success('Access granted');
        loadAllData();
      } else {
        toast.error(data.error || 'Incorrect password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setPassword('');
      toast.success('Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Name',
      'Phone',
      'RSVP Status',
      'Sleeping',
      'Shooting',
      'Show',
      'Notes',
    ];

    const rows = users.map((u) => {
      const shooting = u.activities?.find((a) => a.activity_type === 'shooting');
      const show = u.activities?.find((a) => a.activity_type === 'show');

      return [
        u.name,
        displayPhoneNumber(u.phone_number),
        u.rsvp?.attendance_status || 'not set',
        u.rsvp?.sleeping_arrangement || 'not set',
        shooting?.participation_level || 'not set',
        show?.participation_level || 'not set',
        u.rsvp?.notes || '',
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bachelor-party-rsvps-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  if (isLoading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Password prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Navigation />

        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Admin Access Required
              </CardTitle>
              <CardDescription>
                Enter the admin password to view RSVP data and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    <Lock className="w-4 h-4 inline mr-1" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    autoFocus
                    required
                    disabled={checkingAuth}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={checkingAuth}>
                  {checkingAuth ? 'Verifying...' : 'Unlock Admin Panel'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  const stats = {
    total: users.length,
    attending: users.filter((u) => u.rsvp?.attendance_status === 'yes').length,
    maybe: users.filter((u) => u.rsvp?.attendance_status === 'maybe').length,
    notAttending: users.filter((u) => u.rsvp?.attendance_status === 'no').length,
    houseBeds: users.filter((u) => u.rsvp?.sleeping_arrangement === 'house_bed').length,
    shootingParticipating: users.filter((u) =>
      u.activities?.some((a) => a.activity_type === 'shooting' && a.participation_level === 'participating')
    ).length,
    shootingWatching: users.filter((u) =>
      u.activities?.some((a) => a.activity_type === 'shooting' && a.participation_level === 'watching')
    ).length,
    showAttending: users.filter((u) =>
      u.activities?.some((a) => a.activity_type === 'show' && a.participation_level === 'participating')
    ).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Overview of all RSVPs and activity signups
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attending</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.attending}</div>
              <p className="text-xs text-muted-foreground">
                {stats.maybe} maybe, {stats.notAttending} no
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">House Beds Claimed</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.houseBeds} / 11</div>
              <p className="text-xs text-muted-foreground">
                {11 - stats.houseBeds} beds remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity Signups</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-bold text-lg">{stats.shootingParticipating}</span> shooting
                  <span className="text-muted-foreground text-xs ml-1">
                    (+{stats.shootingWatching} watching)
                  </span>
                </p>
                <p>
                  <span className="font-bold text-lg">{stats.showAttending}</span> show tickets
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="rsvps" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="event">Event Info</TabsTrigger>
          </TabsList>

          {/* RSVPs Tab */}
          <TabsContent value="rsvps" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Attendees</CardTitle>
                <CardDescription>
                  Complete list of registered users and their responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">All ({users.length})</TabsTrigger>
                      <TabsTrigger value="attending">Attending ({stats.attending})</TabsTrigger>
                      <TabsTrigger value="maybe">Maybe ({stats.maybe})</TabsTrigger>
                      <TabsTrigger value="no">Not Coming ({stats.notAttending})</TabsTrigger>
                    </TabsList>

                    {['all', 'attending', 'maybe', 'no'].map((tab) => {
                      let filteredUsers = users;
                      if (tab === 'attending') filteredUsers = users.filter((u) => u.rsvp?.attendance_status === 'yes');
                      if (tab === 'maybe') filteredUsers = users.filter((u) => u.rsvp?.attendance_status === 'maybe');
                      if (tab === 'no') filteredUsers = users.filter((u) => u.rsvp?.attendance_status === 'no');

                      return (
                        <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                          {filteredUsers.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No users in this category</p>
                          ) : (
                            filteredUsers.map((u) => {
                              const shooting = u.activities?.find((a) => a.activity_type === 'shooting');
                              const show = u.activities?.find((a) => a.activity_type === 'show');

                              return (
                                <div key={u.id} className="border border-border rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="font-semibold text-lg">{u.name}</h3>
                                      <p className="text-sm text-muted-foreground">
                                        {displayPhoneNumber(u.phone_number)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <span
                                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                          u.rsvp?.attendance_status === 'yes'
                                            ? 'bg-green-500/20 text-green-400'
                                            : u.rsvp?.attendance_status === 'maybe'
                                            ? 'bg-yellow-500/20 text-yellow-400'
                                            : u.rsvp?.attendance_status === 'no'
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-gray-500/20 text-gray-400'
                                        }`}
                                      >
                                        {u.rsvp?.attendance_status || 'not set'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid sm:grid-cols-3 gap-3 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Sleeping:</p>
                                      <p className="font-medium">
                                        {u.rsvp?.sleeping_arrangement?.replace('_', ' ') || 'not set'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Shooting:</p>
                                      <p className="font-medium">
                                        {shooting?.participation_level?.replace('_', ' ') || 'not set'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Show:</p>
                                      <p className="font-medium">
                                        {show?.participation_level?.replace('_', ' ') || 'not set'}
                                      </p>
                                    </div>
                                  </div>

                                  {u.rsvp?.notes && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                      <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                                      <p className="text-sm">{u.rsvp.notes}</p>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invited Guests Tab */}
          <TabsContent value="guests">
            <InvitedUsersManager />
          </TabsContent>

          {/* Activities Management Tab */}
          <TabsContent value="activities">
            <ActivitiesManagerEnhanced userId={user?.id || ''} />
          </TabsContent>

          {/* Event Info Tab */}
          <TabsContent value="event">
            <EventInfoEditorWYSIWYG userId={user?.id || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase, User, RSVP, UserPredictionStats } from '@/lib/supabase';
import { displayPhoneNumber } from '@/lib/auth-utils';
import { Users, Search, Phone, Bed, Trophy, Target, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

type UserWithDetails = User & {
  rsvp?: RSVP;
  predictionStats?: UserPredictionStats;
};

export default function DirectoryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      loadDirectory();
    }
  }, [user]);

  useEffect(() => {
    // Filter users based on search query
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter((u) =>
        u.name.toLowerCase().includes(query) ||
        u.phone_number.includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadDirectory = async () => {
    setLoading(true);

    try {
      // Load all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('name', { ascending: true });

      if (usersError) {
        console.error('Error loading users:', usersError);
        toast.error('Failed to load directory');
        return;
      }

      // Load all RSVPs
      const { data: rsvpsData, error: rsvpsError } = await supabase
        .from('rsvps')
        .select('*');

      if (rsvpsError) {
        console.error('Error loading RSVPs:', rsvpsError);
      }

      // Load all prediction stats
      const { data: predictionStatsData, error: predictionStatsError } = await supabase
        .from('user_prediction_stats')
        .select('*');

      if (predictionStatsError) {
        console.error('Error loading prediction stats:', predictionStatsError);
      }

      // Combine data
      const usersWithDetails: UserWithDetails[] = (usersData || []).map((u) => ({
        ...u,
        rsvp: rsvpsData?.find((r) => r.user_id === u.id),
        predictionStats: predictionStatsData?.find((ps) => ps.user_id === u.id),
      }));

      setUsers(usersWithDetails);
      setFilteredUsers(usersWithDetails);
    } catch (error) {
      console.error('Error loading directory:', error);
      toast.error('Failed to load directory');
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

  // Only show users who are attending (yes or maybe)
  const attendingUsers = filteredUsers.filter(
    (u) => u.rsvp?.attendance_status === 'yes' || u.rsvp?.attendance_status === 'maybe'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Users className="w-8 h-8" />
            Attendee Directory
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect with other guests attending the bachelor party
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attending</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{attendingUsers.length}</div>
              <p className="text-xs text-muted-foreground">
                {users.filter((u) => u.rsvp?.attendance_status === 'yes').length} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">House Beds</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {users.filter((u) => u.rsvp?.sleeping_arrangement === 'house_bed').length}
              </div>
              <p className="text-xs text-muted-foreground">guests staying at house</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Predictions Leader</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {(() => {
                const topPlayer = [...users]
                  .filter(u => u.predictionStats)
                  .sort((a, b) => (b.predictionStats?.total_points || 0) - (a.predictionStats?.total_points || 0))[0];

                return topPlayer?.predictionStats ? (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-primary">{topPlayer.name}</div>
                    <p className="text-sm text-muted-foreground">
                      {topPlayer.predictionStats.total_points} points
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No predictions yet</p>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Directory List */}
        <Card>
          <CardHeader>
            <CardTitle>All Attendees ({attendingUsers.length})</CardTitle>
            <CardDescription>
              Contact information and details for all guests attending the event
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendingUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? 'No attendees match your search' : 'No attendees yet'}
              </p>
            ) : (
              <div className="space-y-4">
                {attendingUsers.map((u) => {
                  return (
                    <div
                      key={u.id}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Name and Contact */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-full">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{u.name}</h3>
                                {u.title && (
                                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
                                    {u.title}
                                  </span>
                                )}
                              </div>
                              <a
                                href={`tel:${u.phone_number}`}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {displayPhoneNumber(u.phone_number)}
                              </a>
                              {u.note && (
                                <div className="mt-2 flex items-start gap-1">
                                  <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5" />
                                  <p className="text-sm text-muted-foreground italic">{u.note}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex gap-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              u.rsvp?.attendance_status === 'yes'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {u.rsvp?.attendance_status === 'yes' ? 'Attending' : 'Maybe'}
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Bed className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Sleeping</p>
                            <p className="text-sm font-medium">
                              {u.rsvp?.sleeping_arrangement === 'house_bed' && 'House Bed'}
                              {u.rsvp?.sleeping_arrangement === 'own_place' && 'Own Place'}
                              {u.rsvp?.sleeping_arrangement === 'not_staying' && 'Not Staying'}
                              {!u.rsvp?.sleeping_arrangement && 'Not Set'}
                            </p>
                          </div>
                        </div>

                        {u.predictionStats && (
                          <>
                            <div className="flex items-center gap-2">
                              <Target className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Prediction Points</p>
                                <p className="text-sm font-medium">
                                  {u.predictionStats.total_points} points
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Trophy className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-xs text-muted-foreground">Accuracy</p>
                                <p className="text-sm font-medium">
                                  {u.predictionStats.total_predictions > 0
                                    ? `${Math.round((u.predictionStats.correct_predictions / u.predictionStats.total_predictions) * 100)}%`
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Bed, DollarSign, Gun, Theater, Plane, Clock, AlertCircle } from 'lucide-react';

export default function InfoPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
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

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-2 text-primary">
            Jakob&apos;s Bachelor Weekend
          </h1>
          <p className="text-2xl text-muted-foreground">Las Vegas, Nov 14–16</p>
        </div>

        {/* Location Card */}
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MapPin className="w-6 h-6 text-primary" />
              The House
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-lg font-semibold mb-2">Address:</p>
              <p className="text-xl text-primary">7340 South Ullom Drive</p>
              <p className="text-xl text-primary mb-3">Las Vegas, NV 89139</p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=7340+South+Ullom+Drive+Las+Vegas+NV+89139"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Open in Google Maps →
              </a>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-start gap-3">
                <Bed className="w-5 h-5 mt-1 text-primary" />
                <div>
                  <p className="font-semibold mb-1">Sleeping Arrangements:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 11 beds total, 9 already claimed</li>
                    <li>• Can accommodate up to 16 people if we get cozy</li>
                    <li>• Want a guaranteed bed? Let us know ASAP!</li>
                    <li>• Out of space? Join the events anyway! Grab a hotel or Airbnb nearby</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <div className="space-y-6 mb-8">
          {/* Friday */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-5 h-5 text-primary" />
                Friday – Arrival & Night Out
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Plane className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Afternoon Arrival</p>
                  <p className="text-sm text-muted-foreground">
                    Most people rolling in Friday afternoon
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Evening Kickoff</p>
                  <p className="text-sm text-muted-foreground">
                    Get-together at the house before heading to the Strip
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Theater className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Night on the Town</p>
                  <p className="text-sm text-muted-foreground">
                    Drinks, food, hangout, then out for a night in Vegas (bars, gambling, maybe a club)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saturday */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-5 h-5 text-primary" />
                Saturday – Action Day
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Gun className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium text-lg">Morning: Shooting Range</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Breakfast at the house, then we&apos;re going shooting
                  </p>
                  <div className="bg-accent/50 p-3 rounded-lg space-y-1">
                    <p className="text-sm">
                      <span className="font-medium text-primary">Cost:</span> $100–150 if you want to shoot
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Just want to watch? No problem, no cost!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Let us know if you&apos;re in so we can book for you
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <Theater className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                  <div>
                    <p className="font-medium text-lg">Evening: The Empire Strips Back</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Star Wars burlesque parody show - it&apos;s legendary!
                    </p>
                    <div className="bg-accent/50 p-3 rounded-lg space-y-1">
                      <p className="text-sm">
                        <span className="font-medium text-primary">Cost:</span> $50–80 depending on seats
                      </p>
                      <p className="text-sm text-muted-foreground">
                        If you&apos;re in, let us know so we can book and keep everyone together
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="font-medium">After the Show:</p>
                <p className="text-sm text-muted-foreground">
                  Dinner and another night out — casinos, drinks, whatever happens in Vegas!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sunday */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calendar className="w-5 h-5 text-primary" />
                Sunday – Wrap-up
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <Plane className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="font-medium">Checkout at 11am</p>
                  <p className="text-sm text-muted-foreground">
                    Pack up and head back to Phoenix around 11am
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Notes */}
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              A Few Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <p className="text-sm">
                We&apos;re juggling a big group, so expect some splitting up here and there, but hopefully we stick together most of the time
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <p className="text-sm">
                If you only want to join part of the weekend (just the shooting, just the show, etc.), that&apos;s totally fine — just let us know what you&apos;re in for
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <p className="text-sm font-semibold">
                Please confirm by October 15th so we can book everything and sort sleeping arrangements
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Summary */}
        <Card className="mt-8 bg-primary/10 border-primary/50">
          <CardHeader>
            <CardTitle>TL;DR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-1 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-xs text-muted-foreground">Las Vegas, Nov 14–16</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Bed className="w-4 h-4 mt-1 text-primary" />
                  <div>
                    <p className="text-sm font-medium">The House</p>
                    <p className="text-xs text-muted-foreground">7340 S Ullom Dr — 11 beds, 9 taken</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Gun className="w-4 h-4 mt-1 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Shooting</p>
                    <p className="text-xs text-muted-foreground">Saturday morning ($100–150)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Theater className="w-4 h-4 mt-1 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Empire Strips Back</p>
                    <p className="text-xs text-muted-foreground">Saturday night ($50–80)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm text-center font-medium">
                Nights out, gambling, chaos guaranteed • Let us know what you&apos;re joining by Oct 15
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { loginOrCreateUser, formatPhoneNumber, displayPhoneNumber, isValidPhoneNumber } from '@/lib/auth-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Dices } from 'lucide-react';

export default function Home() {
  const { user, setUser, isLoading } = useAuth();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    const formatted = formatPhoneNumber(phoneNumber);
    if (!isValidPhoneNumber(formatted)) {
      toast.error('Please enter a valid phone number (US: 10 digits, Norwegian: 8 digits)');
      return;
    }

    setIsSubmitting(true);

    try {
      const { user: foundUser, error, isNewUser } = await loginOrCreateUser(phoneNumber);

      if (error) {
        if (isNewUser) {
          // Need to collect name
          setShowNameInput(true);
          setIsSubmitting(false);
          return;
        }
        toast.error(error);
        setIsSubmitting(false);
        return;
      }

      if (foundUser) {
        setUser(foundUser);
        toast.success(`Welcome back, ${foundUser.name}!`);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsSubmitting(true);

    try {
      const { user: newUser, error } = await loginOrCreateUser(phoneNumber, name);

      if (error) {
        toast.error(error);
        setIsSubmitting(false);
        return;
      }

      if (newUser) {
        setUser(newUser);
        toast.success(`Welcome, ${newUser.name}! Let's get you set up.`);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't show login form if already logged in
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Dices className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-primary">
            Jakob&apos;s Bachelor Party
          </h1>
          <p className="text-xl text-muted-foreground">Las Vegas, Nov 14-16</p>
        </div>

        {/* Login/Signup Card */}
        <Card className="border-border/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">
              {showNameInput ? 'Almost There!' : 'Get Started'}
            </CardTitle>
            <CardDescription>
              {showNameInput
                ? 'Enter your name to complete registration'
                : 'Enter your phone number to RSVP and view event details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showNameInput ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => {
                      const formatted = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(formatted);
                    }}
                    className="text-lg"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    {phoneNumber && isValidPhoneNumber(phoneNumber)
                      ? `Formatted: ${displayPhoneNumber(phoneNumber)}`
                      : 'Enter US (10 digits) or Norwegian (8 digits) number'}
                  </p>
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Checking...' : 'Continue'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg"
                    required
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNameInput(false);
                      setName('');
                      setIsSubmitting(false);
                    }}
                    className="w-full"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating Account...' : 'Join the Party'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Info footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Your phone number is only used to save your RSVP preferences.</p>
          <p className="mt-1">No SMS messages will be sent.</p>
        </div>
      </div>
    </div>
  );
}

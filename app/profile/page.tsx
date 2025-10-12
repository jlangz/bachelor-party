'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { displayPhoneNumber, updateUserProfile } from '@/lib/auth-utils';
import { toast } from 'sonner';
import { User, Save, Phone, Mail, MessageSquare } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser, isLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Fetch fresh user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/users/${user.id}`);
        if (response.ok) {
          const freshUserData = await response.json();
          // Update the auth context with fresh data
          setUser(freshUserData);
          // Update form fields
          setName(freshUserData.name);
          setEmail(freshUserData.email || '');
          setNote(freshUserData.note || '');
        } else {
          // Fallback to cached user data if fetch fails
          setName(user.name);
          setEmail(user.email || '');
          setNote(user.note || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to cached user data if fetch fails
        setName(user.name);
        setEmail(user.email || '');
        setNote(user.note || '');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id, setUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedNote = note.trim();

    if (!trimmedName) {
      toast.error('Name cannot be empty');
      return;
    }

    if (trimmedNote.length > 100) {
      toast.error('Note must be 100 characters or less');
      return;
    }

    if (trimmedName === user.name && trimmedEmail === (user.email || '') && trimmedNote === (user.note || '')) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);

    try {
      const { user: updatedUser, error } = await updateUserProfile(
        user.id,
        trimmedName,
        trimmedEmail || null,
        trimmedNote || null
      );

      if (error) {
        toast.error(error);
      } else if (updatedUser) {
        setUser(updatedUser);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <User className="w-8 h-8" />
            Profile Settings
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your account information
          </p>
        </div>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your phone number is used to log in and cannot be changed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone Number (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="text"
                value={displayPhoneNumber(user.phone_number)}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Your phone number is your login credential and cannot be changed
              </p>
            </div>

            {/* Name and Email (Editable) */}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This is how your name will appear to the organizers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Your email will only be visible to organizers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Directory Note (Optional)
                </Label>
                <Textarea
                  id="note"
                  placeholder="Write something about yourself, how you know me, what you're looking forward to, etc. It'll show in the directory. (max 100 characters)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={saving}
                  maxLength={100}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  {note.length}/100 characters · This will be visible to all guests in the directory
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={saving || (name.trim() === user.name && email.trim() === (user.email || '') && note.trim() === (user.note || ''))}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Information about your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-sm text-muted-foreground">Account Created</span>
              <span className="text-sm font-medium">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm font-mono text-muted-foreground">{user.id.slice(0, 8)}...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { supabase, InvitedUser } from '@/lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import { UserPlus, Trash2, Users } from 'lucide-react';
import { formatPhoneNumber, displayPhoneNumber, isValidPhoneNumber } from '@/lib/auth-utils';

export function InvitedUsersManager() {
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadInvitedUsers();
  }, []);

  const loadInvitedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invited_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invited users:', error);
        toast.error('Failed to load invited users');
      } else {
        setInvitedUsers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const formatted = formatPhoneNumber(newPhone);
    if (!isValidPhoneNumber(formatted)) {
      toast.error('Please enter a valid phone number (US: 10 digits, Norwegian: 8 digits)');
      return;
    }

    if (!newName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    setAdding(true);

    try {
      // Check if already invited
      const existing = invitedUsers.find((u) => u.phone_number === formatted);
      if (existing) {
        toast.error('This phone number is already on the guest list');
        setAdding(false);
        return;
      }

      const { data, error } = await supabase
        .from('invited_users')
        .insert([{ phone_number: formatted, name: newName.trim() }])
        .select()
        .single();

      if (error) {
        console.error('Error adding user:', error);
        toast.error('Failed to add user');
      } else {
        toast.success(`${newName} added to guest list!`);
        setNewName('');
        setNewPhone('');
        setInvitedUsers([data, ...invitedUsers]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the guest list?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('invited_users').delete().eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to remove user');
      } else {
        toast.success(`${name} removed from guest list`);
        setInvitedUsers(invitedUsers.filter((u) => u.id !== id));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Guest to Invite List
          </CardTitle>
          <CardDescription>
            Add a guest's phone number to allow them to create an account and RSVP
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={adding}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="5551234567 or 95455057"
                  value={newPhone}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewPhone(formatted);
                  }}
                  disabled={adding}
                  required
                />
                {newPhone && isValidPhoneNumber(newPhone) && (
                  <p className="text-xs text-muted-foreground">
                    Format: {displayPhoneNumber(newPhone)}
                  </p>
                )}
              </div>
            </div>
            <Button type="submit" disabled={adding}>
              <UserPlus className="w-4 h-4 mr-2" />
              {adding ? 'Adding...' : 'Add to Guest List'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invited Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Invited Guests ({invitedUsers.length})
          </CardTitle>
          <CardDescription>
            These phone numbers can create accounts and RSVP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : invitedUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No guests invited yet. Add some above!
            </p>
          ) : (
            <div className="space-y-2">
              {invitedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {displayPhoneNumber(user.phone_number)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { supabase, User } from '@/lib/supabase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { UserPlus, Trash2, Users, Shield, Edit, X, Check } from 'lucide-react';
import { formatPhoneNumber, displayPhoneNumber, isValidPhoneNumber } from '@/lib/auth-utils';
import { useAuth } from '@/lib/auth-context';

export function InvitedUsersManager() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'guest' as 'admin' | 'guest',
    title: '',
    note: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } else {
        setUsers(data || []);
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
      // Check if already exists
      const existing = users.find((u) => u.phone_number === formatted);
      if (existing) {
        toast.error('This phone number is already on the list');
        setAdding(false);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .insert([{
          phone_number: formatted,
          name: newName.trim(),
          title: newTitle.trim() || null,
          role: isAdmin ? 'admin' : 'guest',
          invited_by: 'admin'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding user:', error);
        toast.error('Failed to add user');
      } else {
        toast.success(`${newName} added to ${isAdmin ? 'admins' : 'guest list'}!`);
        setNewName('');
        setNewPhone('');
        setNewTitle('');
        setIsAdmin(false);
        setUsers([data, ...users]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string, hasAccount: boolean) => {
    if (hasAccount) {
      toast.error(`Cannot remove ${name} - they have already registered`);
      return;
    }

    if (!confirm(`Remove ${name} from the list?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to remove user');
      } else {
        toast.success(`${name} removed from list`);
        setUsers(users.filter((u) => u.id !== id));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditForm({
      name: user.name,
      email: user.email || '',
      role: user.role,
      title: user.title || '',
      note: user.note || '',
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setEditForm({
      name: '',
      email: '',
      role: 'guest',
      title: '',
      note: '',
    });
  };

  const handleUpdateUser = async (userId: string) => {
    if (!currentUser) {
      toast.error('Not authenticated');
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUserId: currentUser.id,
          name: editForm.name,
          email: editForm.email || null,
          role: editForm.role,
          title: editForm.title || null,
          note: editForm.note || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      toast.success('User updated successfully');
      cancelEdit();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  // Separate users into categories
  const adminUsers = users.filter((u) => u.role === 'admin');
  const guestUsers = users.filter((u) => u.role === 'guest');

  return (
    <div className="space-y-6">
      {/* Add User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add User
          </CardTitle>
          <CardDescription>
            Add a phone number to invite someone - they can register when they login
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

            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Groom, Best Man, Brother, etc."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={adding}
              />
              <p className="text-xs text-muted-foreground">
                This will be displayed next to their name in the directory
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAdmin"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="rounded border-border"
              />
              <Label htmlFor="isAdmin" className="flex items-center gap-2 cursor-pointer">
                <Shield className="w-4 h-4 text-primary" />
                Make this user an admin
              </Label>
            </div>

            <Button type="submit" disabled={adding}>
              <UserPlus className="w-4 h-4 mr-2" />
              {adding ? 'Adding...' : 'Add User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Admin Users */}
      {adminUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Administrators ({adminUsers.length})
            </CardTitle>
            <CardDescription>
              Admin users have full access to the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adminUsers.map((user) => (
                <div
                  key={user.id}
                >
                  <div className="flex items-center justify-between p-3 border border-primary/30 rounded-lg bg-primary/5">
                    <div className="flex-1">
                      <p className="font-medium flex items-center gap-2">
                        {user.name}
                        <Shield className="w-3 h-3 text-primary" />
                        {user.title && (
                          <span className="text-xs font-normal bg-primary/20 text-primary px-2 py-0.5 rounded">
                            {user.title}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {displayPhoneNumber(user.phone_number)}
                      </p>
                      {user.email && (
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(user)}
                        className="hover:bg-primary/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id, user.name, false)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {editingUserId === user.id && (
                    <div className="mt-2 p-4 border border-primary/50 rounded-lg bg-card space-y-3">
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${user.id}`}>Name</Label>
                          <Input
                            id={`edit-name-${user.id}`}
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
                          <Input
                            id={`edit-email-${user.id}`}
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            placeholder="user@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-role-${user.id}`}>Role</Label>
                          <Select
                            value={editForm.role}
                            onValueChange={(value: 'admin' | 'guest') => setEditForm({ ...editForm, role: value })}
                          >
                            <SelectTrigger id={`edit-role-${user.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="guest">Guest</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-title-${user.id}`}>Title</Label>
                          <Input
                            id={`edit-title-${user.id}`}
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="e.g., Best Man, Brother"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-note-${user.id}`}>Note</Label>
                          <Input
                            id={`edit-note-${user.id}`}
                            value={editForm.note}
                            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                            placeholder="Internal note"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdateUser(user.id)} size="sm">
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guest Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Guests ({guestUsers.length})
          </CardTitle>
          <CardDescription>
            Invited guests who can create accounts and RSVP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : guestUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No guests invited yet. Add some above!
            </p>
          ) : (
            <div className="space-y-2">
              {guestUsers.map((user) => (
                <div
                  key={user.id}
                >
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {user.name}
                        {user.title && (
                          <span className="text-xs font-normal bg-accent text-foreground px-2 py-0.5 rounded">
                            {user.title}
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {displayPhoneNumber(user.phone_number)}
                      </p>
                      {user.email && (
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(user)}
                        className="hover:bg-primary/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteUser(user.id, user.name, false)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {editingUserId === user.id && (
                    <div className="mt-2 p-4 border border-primary/50 rounded-lg bg-card space-y-3">
                      <div className="grid gap-3">
                        <div className="space-y-2">
                          <Label htmlFor={`edit-name-${user.id}`}>Name</Label>
                          <Input
                            id={`edit-name-${user.id}`}
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-email-${user.id}`}>Email</Label>
                          <Input
                            id={`edit-email-${user.id}`}
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            placeholder="user@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-role-${user.id}`}>Role</Label>
                          <Select
                            value={editForm.role}
                            onValueChange={(value: 'admin' | 'guest') => setEditForm({ ...editForm, role: value })}
                          >
                            <SelectTrigger id={`edit-role-${user.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="guest">Guest</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-title-${user.id}`}>Title</Label>
                          <Input
                            id={`edit-title-${user.id}`}
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="e.g., Best Man, Brother"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`edit-note-${user.id}`}>Note</Label>
                          <Input
                            id={`edit-note-${user.id}`}
                            value={editForm.note}
                            onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                            placeholder="Internal note"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleUpdateUser(user.id)} size="sm">
                          <Check className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

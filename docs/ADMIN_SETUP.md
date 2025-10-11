# Admin Features Setup Guide

This guide will help you set up the new admin features including password management, event info editing, and dynamic activities management.

## Overview of New Features

### 1. **Admin Password Management**
- Admins can set their own passwords in the database
- Passwords are securely hashed using bcrypt
- Falls back to environment variable if no password is set

### 2. **Event Information Editor**
- Manage event name, dates, location
- Update house bed count
- Edit event description

### 3. **Dynamic Activities System**
- Add, edit, and delete activities
- Customize participation options for each activity
- Reorder activities

### 4. **Invited Guests Management**
- Already exists, now in a dedicated tab

## Database Migration Steps

### Step 1: Run the Migration SQL

1. Log into your Supabase dashboard
2. Navigate to **SQL Editor**
3. Open the file: `database/admin-features-migration.sql`
4. Copy and paste the entire contents into the SQL editor
5. Click **Run** to execute the migration

This will create:
- `admin_passwords` table for storing hashed admin passwords
- `event_info` table for managing event details
- `activities` table for dynamic activity management
- Updates to `activity_signups` to support the new activities system
- All necessary RLS (Row Level Security) policies

### Step 2: Verify the Migration

Run this query to verify everything was created successfully:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('admin_passwords', 'event_info', 'activities');

-- Check default activities
SELECT * FROM activities WHERE is_active = true;

-- Check event info
SELECT * FROM event_info;
```

You should see:
- 3 tables listed
- 2 default activities (Shooting Range, Show/Entertainment)
- 1 event info row with default values

## Using the New Admin Features

### Accessing the Admin Panel

1. Navigate to `/admin` in your app
2. Log in with the phone number of an admin user
3. Enter the admin password (use environment variable password initially)

### Admin Dashboard Tabs

Once logged in, you'll see 5 tabs:

#### 1. **RSVPs Tab**
- View all registered users and their responses
- Filter by attendance status (All, Attending, Maybe, Not Coming)
- Export to CSV
- Shows RSVP details, sleeping arrangements, and activity signups

#### 2. **Guests Tab**
- Manage invited users
- Add new invited guests
- Remove guests who haven't registered yet

#### 3. **Activities Tab**
- **Add New Activities**: Click "Add Activity" button
  - Enter activity name (required)
  - Add description
  - Choose type: Participatory, Spectator, or Mixed
  - Define participation options (comma-separated)
- **Edit Activities**: Click edit icon to modify existing activities
- **Delete Activities**: Click trash icon (soft delete - marks as inactive)

**Activity Options Example:**
- For a poker game: `playing,watching,not_attending`
- For a dinner: `attending,not_attending`
- For an optional tour: `interested,maybe,not_interested`

#### 4. **Event Info Tab**
- Edit event name
- Set start and end dates
- Update location name and address
- Modify event description
- Adjust total house beds available

#### 5. **Settings Tab**
- **Set/Update Password**:
  - First time: Enter new password (no current password needed)
  - Updating: Enter current password + new password
  - Minimum 8 characters required
- Once password is set, it will be used for all future logins

## Environment Variables

### Current Setup (Backward Compatible)

The system falls back to environment variables if no database password is set:

```env
# .env.local
ADMIN_PASSWORD=your-admin-password-here
```

### Recommended: Set Password in Database

1. Go to Admin Panel → Settings tab
2. Set your password there
3. The database password will take precedence over env variable

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- Admin session cookies are HTTP-only
- RLS policies ensure only admins can access management features
- Soft deletes for activities (can be recovered if needed)

## API Endpoints Created

### Password Management
- `POST /api/admin/password/check` - Check if admin has password set
- `POST /api/admin/password/set` - Set or update admin password

### Event Info
- `GET /api/event-info` - Fetch event information (public)
- `PUT /api/event-info` - Update event information (admin only)

### Activities
- `GET /api/activities` - Fetch all active activities (public)
- `POST /api/activities` - Create new activity (admin only)
- `PUT /api/activities/[id]` - Update activity (admin only)
- `DELETE /api/activities/[id]` - Soft delete activity (admin only)

### Updated Login
- `POST /api/admin/login` - Now accepts `userId` parameter

## Updating Existing Code

### If you have custom activity logic:

The system maintains backward compatibility with hardcoded activities ('shooting', 'show'), but you should eventually update to use the dynamic system.

**Old way:**
```typescript
activity_type === 'shooting'
```

**New way (recommended):**
```typescript
// Fetch activities first
const { data: activities } = await supabase.from('activities').select('*')

// Use activity_id instead of activity_type
activity_id === shootingActivity.id
```

## Troubleshooting

### "Admin password not configured" error
- Either set ADMIN_PASSWORD in environment variables
- OR set password via Settings tab (recommended)

### Can't see new tabs in admin panel
- Make sure you're logged in as an admin user
- Check that the migration ran successfully
- Verify your user has `role = 'admin'` in the users table

### Activities not showing up
- Check `is_active = true` in activities table
- Verify RLS policies are set correctly
- Check browser console for errors

### Password reset
If you forget your database password:

```sql
-- Option 1: Delete password to fall back to env variable
DELETE FROM admin_passwords WHERE user_id = 'your-user-id';

-- Option 2: Use environment variable temporarily, then reset via UI
```

## Next Steps

1. Run the database migration
2. Log into admin panel
3. Set your admin password in Settings
4. Update event information in Event Info tab
5. Add any additional activities in Activities tab
6. Invite guests via Guests tab

## Support

If you encounter issues:
1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Ensure migration ran successfully

---

**Note:** This system is designed to be backward compatible. Existing functionality will continue to work while you transition to the new features.

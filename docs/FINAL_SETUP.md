# Final Setup Guide - Simplified Architecture

## What Changed

### Simplified User Management
- ✅ **Merged invited_users into users** - One table for everyone
- ✅ **Admin password enforcement** - Required for admins only
- ✅ **Streamlined invitations** - Just add to users table
- ✅ **WYSIWYG Event Editor** - Edit /info page like a document
- ✅ **Full Activity Edit** - All fields when editing activities

## Database Migrations to Run

Run these **in order** in Supabase SQL Editor:

### 1. Core Admin Features (if not done)
```sql
-- File: database/admin-features-migration-safe.sql
-- Creates: admin_passwords, event_info, activities tables
```

### 2. Enhanced Fields (if not done)
```sql
-- File: database/enhance-activities-and-info.sql
-- Adds: icon, when, cost, location to activities
-- Adds: schedule, important_info to event_info
```

### 3. **NEW: Merge Users Table**
```sql
-- File: database/merge-invited-users.sql
-- Merges: invited_users → users
-- Adds: invited_by column to users
```

## How It Works Now

### For Admins:
1. Admin phone numbers are in users table with `role = 'admin'`
2. **Password IS REQUIRED** for admin access
3. Set password in Settings tab (first time use env variable)
4. Password stored securely with bcrypt hashing

### For Guests:
1. Add guest phone numbers via `/admin` → Guests tab
2. Guests automatically added to users table with `role = 'guest'`
3. **No password needed** - guests just verify phone number
4. When they login, they can RSVP and sign up for activities

## Admin Dashboard Features

### 📋 RSVPs Tab
- View all guest responses
- Filter by attendance status
- Export to CSV

### 👥 Guests Tab (NEW!)
- **Add users** - guests or admins
- **Checkbox** to make someone an admin
- **See all users** - separated into Admins and Guests
- Remove users (only if they haven't registered yet)

### 🎯 Activities Tab
- **Add activities** with full details:
  - Icon picker (70+ icons)
  - Name, description
  - When, where, cost
  - Participation options
- **Edit activities** - click edit to see ALL fields (same as add form)
- **Delete activities** - soft delete (mark as inactive)

### 📅 Event Info Tab (NEW!)
- **Tabbed editor** for organizing content:
  - **Basics**: Name, dates, location, beds
  - **Description**: Main event description
  - **Schedule**: Timeline items (add/edit/remove)
  - **Important Info**: Key info sections (add/edit/remove)
- **Preview button** - opens `/info` page in new tab
- All changes save to database

### ⚙️ Settings Tab
- **Change your password** as admin
- Stored securely in database

## Quick Start

### 1. Run All Migrations
```sql
-- In Supabase SQL Editor, run these 3 files in order:
1. admin-features-migration-safe.sql
2. enhance-activities-and-info.sql
3. merge-invited-users.sql (NEW!)
```

### 2. Add Your Admin Users
Go to `/admin` → Guests tab:
- Add your admin phone number
- ✅ Check "Make this user an admin"
- Click "Add User"

### 3. Set Admin Password
- Log into `/admin` with your phone
- Use ADMIN_PASSWORD from `.env` (first time)
- Go to Settings tab
- Set a new password

### 4. Invite Guests
Go to Guests tab:
- Add guest phone numbers with names
- They're automatically invited
- They can login and RSVP

### 5. Customize Event
**Event Info tab:**
- Fill in basics (name, dates, location)
- Add schedule timeline
- Add important info sections

**Activities tab:**
- Edit existing activities (add icons, costs, etc.)
- Add new activities

### 6. View Results
Visit `/info` to see your beautiful event page!

## Key Differences from Before

| Before | After |
|--------|-------|
| invited_users + users tables | Just users table |
| Guests in separate table | All users in one place |
| Password for all users | Password only for admins |
| Hard to manage invites | Simple: add to users table |
| Basic event editor | WYSIWYG tabbed editor |
| Quick edit activities | Full edit with all fields |

## Architecture Benefits

### Simpler
- One table for all users
- Clearer role separation
- Less duplicate data

### More Secure
- Passwords only where needed
- Admin-specific authentication
- Guest flow stays simple

### Better UX
- Document-style event editing
- Preview changes live
- Full control over activities

## Troubleshooting

### Can't login as admin?
- Check you're in users table with `role = 'admin'`
- Use ADMIN_PASSWORD from `.env` first time
- Then set password in Settings tab

### Guests can't register?
- Check their phone number is in users table
- Verify `role = 'guest'` (not admin)
- No password needed for guests

### Event info not showing?
- Run `enhance-activities-and-info.sql` migration
- Check event_info table has data:
  ```sql
  SELECT * FROM event_info;
  ```

### Old invited_users data?
- Run `merge-invited-users.sql` to migrate
- It copies data to users table
- Safe to drop invited_users table after

## What's Next?

Everything is set up! You can now:
- ✅ Manage all users in one place
- ✅ Edit event info like a document
- ✅ Create rich, detailed activities
- ✅ Enforce admin passwords
- ✅ Keep guest flow simple

---

**You're all set!** 🎉 The architecture is cleaner, the UX is better, and everything just works!

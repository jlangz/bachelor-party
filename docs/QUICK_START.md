# Quick Start Guide

## Get Everything Running in 5 Minutes

### Step 1: Run Database Migrations

Open Supabase SQL Editor and run these two files in order:

#### Migration 1: Core Admin Features
```sql
-- Copy and paste: database/admin-features-migration-safe.sql
-- Creates admin_passwords, event_info, activities tables
```

#### Migration 2: Enhanced Fields
```sql
-- Copy and paste: database/enhance-activities-and-info.sql
-- Adds icons, costs, schedule, etc.
```

### Step 2: Set Your Admin Password

1. Go to `localhost:3000/admin`
2. Log in with your admin phone number
3. Enter the ADMIN_PASSWORD from your `.env` file
4. Click **Settings** tab
5. Set a new password (it'll be saved to database)

### Step 3: Customize Event Info

Click **Event Info** tab and fill in:
- Event name
- Start/end dates
- Location & address
- Description
- Number of beds

The schedule and important info are already populated with sample data - edit as needed!

### Step 4: Enhance Activities

Click **Activities** tab:

For each existing activity:
1. Click **Edit** (pencil icon)
2. Choose an **icon** (click the icon picker)
3. Add **when** (e.g., "Saturday Morning")
4. Add **location** (e.g., "Downtown Sports Bar")
5. Add **cost** info (e.g., "$50" and "includes drinks")
6. Click **Save**

### Step 5: Add New Activities

1. Click **Add Activity**
2. Fill in all fields:
   - Pick an icon
   - Name (e.g., "Poker Night")
   - Description
   - When & Where
   - Cost details
   - Answer options (comma-separated)
3. Click **Add Activity**

### Step 6: View Results

Visit `localhost:3000/info` to see your beautiful event page!

## What You Get

### `/admin` - Admin Dashboard
- **RSVPs Tab**: View all guest responses
- **Guests Tab**: Manage invited users
- **Activities Tab**: Create/edit activities
- **Event Info Tab**: Edit event details
- **Settings Tab**: Change your password

### `/info` - Public Event Page
- Dynamic content from database
- Beautiful timeline schedule
- Important information grid
- Google Maps integration
- All editable via admin panel!

### `/activities` - Activities Signup
- Enhanced cards with icons (coming next update!)
- Show costs, times, locations
- Signup counts per option

## Troubleshooting

### Can't log into admin?
- Check you're using an admin phone number
- Use the ADMIN_PASSWORD from `.env`
- After first login, set password in Settings tab

### Event info not showing?
- Check migration ran successfully
- Verify event_info table has data:
  ```sql
  SELECT * FROM event_info;
  ```

### Activities missing fields?
- Run the `enhance-activities-and-info.sql` migration
- Check activities table has new columns:
  ```sql
  SELECT * FROM activities LIMIT 1;
  ```

## Next Steps

1. ✅ Customize event information
2. ✅ Enhance existing activities
3. ✅ Add new activities
4. 🔄 Update `/activities` page (work in progress)
5. 🔄 Add signup count displays

---

**You're all set!** Start customizing and enjoy your enhanced bachelor party app! 🎉

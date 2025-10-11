# Jakob's Bachelor Party Website

A modern, Vegas-themed website for managing RSVPs, sleeping arrangements, and activity signups for a bachelor party weekend in Las Vegas.

## Features

- **Phone Number Authentication**: Simple login system using phone numbers (no SMS codes required)
- **RSVP Management**: Guests can indicate if they're attending and where they'll be staying
- **Activity Signups**: Sign up for shooting range and Empire Strips Back show
- **Event Information**: Full schedule and details about the weekend
- **Admin Dashboard**: View all RSVPs, export to CSV, and see signup statistics
- **Vegas-Themed Design**: Dark background with gold accents for that casino vibe
- **Mobile Responsive**: Works perfectly on all devices

## Tech Stack

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** for beautiful UI components
- **Supabase** for PostgreSQL database and real-time data
- **Vercel** for hosting (recommended)

## Quick Start

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to SQL Editor and run the SQL from `supabase-schema.sql`
4. Copy your project URL and anon key from Settings → API

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your site!

## Project Structure

```
bachelor-party/
├── app/
│   ├── page.tsx              # Login/landing page
│   ├── dashboard/page.tsx    # User dashboard with overview
│   ├── info/page.tsx         # Event information
│   ├── rsvp/page.tsx         # RSVP form
│   ├── activities/page.tsx   # Activity signups
│   └── admin/page.tsx        # Admin panel
├── components/
│   ├── navigation.tsx        # Main navigation bar
│   └── ui/                   # Shadcn UI components
├── lib/
│   ├── supabase.ts           # Supabase client and types
│   ├── auth-context.tsx      # Authentication context
│   └── auth-utils.ts         # Auth helper functions
├── supabase-schema.sql       # Database schema
└── SETUP.md                  # Detailed setup guide
```

## Pages Overview

### Landing Page (`/`)
- Phone number login
- New user registration with name
- Auto-redirects logged-in users to dashboard

### Dashboard (`/dashboard`)
- Welcome message with user's name
- Countdown to event
- Quick status overview (RSVP, sleeping, activities)
- Quick links to other pages

### Event Info (`/info`)
- Full event schedule (Friday-Sunday)
- House address with Google Maps link
- Activity details and pricing
- Important notes and TL;DR summary

### RSVP (`/rsvp`)
- Attendance status (Yes/Maybe/No)
- Sleeping arrangement selection
- Additional notes field

### Activities (`/activities`)
- Shooting range signup with pricing
- Empire Strips Back show signup
- Real-time participant counts

### Admin Panel (`/admin`)
- Password-protected dashboard
- View all RSVPs and signups
- Statistics overview
- Export data to CSV

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`
5. Click "Deploy"

Your site will be live at `https://your-project.vercel.app`!

### Alternative: Vercel CLI

```bash
npm i -g vercel
vercel
```

## Customization

### Change Event Details

Edit the event information in `app/info/page.tsx`:
- Dates, times, and locations
- Activity descriptions and pricing
- House address and bed count

### Change Theme Colors

Edit `app/globals.css` to customize the Vegas-themed colors:
- `--primary`: Gold accent color
- `--background`: Dark background color
- `--destructive`: Red accent color

### Change Admin Password

Update `NEXT_PUBLIC_ADMIN_PASSWORD` in your `.env.local` file and redeploy.

## Database Schema

The database has three main tables:

**users**
- Stores phone numbers and names
- Primary authentication table

**rsvps**
- Attendance status (yes/no/maybe)
- Sleeping arrangement choice
- Additional notes

**activity_signups**
- Activity type (shooting/show)
- Participation level (participating/watching/not_attending)

## Support

For detailed setup instructions, see [SETUP.md](./SETUP.md)

For issues or questions, contact the developer or check the Supabase and Next.js documentation.

## License

MIT License - feel free to use this for your own bachelor party or events!

---

Built with ❤️ for Jakob's bachelor party in Las Vegas!

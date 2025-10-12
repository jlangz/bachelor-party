# Bachelor Party Web App

A comprehensive event management platform for bachelor parties, featuring RSVP management, activity planning, place recommendations with maps, predictions/betting system, and social posts.

## Features

- **Phone-based Authentication** - Simple login using phone numbers (no passwords for guests)
- **Event Management** - Centralized event information, schedules, and important details
- **RSVP System** - Track attendance and sleeping arrangements
- **Activity Planning** - Create and manage activities with custom participation options
- **Place Recommendations** - Google Maps integration for sharing restaurants, bars, and venues
- **Predictions & Betting** - Fun betting system with points, leaderboards, and streaks
- **Social Feed** - Share posts, photos, and updates with comments and likes
- **Guest Directory** - See who's coming with custom notes and contact info
- **Admin Controls** - Password-protected admin features for organizers
- **Mobile Responsive** - Optimized for both desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 (React 19)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **Maps**: Google Maps API
- **UI Components**: Radix UI + shadcn/ui
- **Rich Text**: TipTap Editor
- **Deployment**: Vercel

## Prerequisites

- Node.js 20+ and npm/yarn
- Supabase account (free tier works)
- Google Cloud account (for Maps API)
- Vercel account (for deployment, optional)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Admin Password (for admin access)
NEXT_PRIVATE_ADMIN_PASSWORD=your_secure_admin_password
```

### Getting Your Credentials

**Supabase:**
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy the "Project URL" and "anon/public" key

**Google Maps:**
1. Create a project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable "Maps JavaScript API" and "Places API"
3. Create an API key under "Credentials"
4. Restrict the key to your domain for production

**Admin Password:**
- Choose any secure password for admin users

## Database Setup

Run the SQL scripts in SUPABASE_SEED.md to get the data structure started

## Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bachelor-party
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.local.example` to `.env.local` (or create it)
   - Fill in your Supabase and Google Maps credentials

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`
   - Log in with your test phone number

## Deployment to Vercel

### Option 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   - In the Vercel dashboard, go to Settings > Environment Variables
   - Add all variables from your `.env.local`:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
     - `NEXT_PRIVATE_ADMIN_PASSWORD`

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Every push to `main` will trigger a new deployment

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   vercel env add NEXT_PRIVATE_ADMIN_PASSWORD
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Post-Deployment

1. **Update Google Maps API restrictions**
   - Add your Vercel domain to allowed referrers
   - Example: `https://your-app.vercel.app/*`

2. **Test the deployment**
   - Visit your Vercel URL
   - Try logging in with a phone number
   - Verify all features work (maps, predictions, posts, etc.)

## Project Structure

```
bachelor-party/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Main dashboard page
│   ├── profile/           # User profile page
│   ├── rsvp/             # RSVP page
│   ├── activities/        # Activities page
│   ├── recommendations/   # Places/recommendations page
│   ├── predictions/       # Predictions/betting page
│   ├── posts/            # Social feed page
│   └── directory/        # Guest directory
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── navigation.tsx   # Main navigation
│   └── ...             # Feature components
├── lib/                 # Utility functions
│   ├── supabase.ts     # Supabase client
│   ├── auth-context.tsx # Authentication
│   └── ...            # Other utilities
├── supabase/
│   └── migrations/     # Database migrations
├── public/            # Static assets
└── .env.local        # Environment variables (not committed)
```

## Features Guide

### Admin Features

Admin users (role = 'admin') can:
- Manage event information
- Create and edit activities
- Create predictions
- Reveal prediction results
- Edit user profiles

### User Features

All authenticated users can:
- Submit RSVP with sleeping arrangements
- Sign up for activities
- Add place recommendations with maps
- Like and comment on recommendations
- Place bets on predictions
- Create posts with photos
- Like and comment on posts
- View leaderboards and stats

## Common Issues

**Maps not loading?**
- Verify Google Maps API key is correct
- Check that Maps JavaScript API and Places API are enabled
- Ensure billing is set up on Google Cloud (required even for free tier)

**Database errors?**
- Confirm Supabase URL and anon key are correct
- Check that RLS policies are properly configured
- Verify tables were created successfully

**Build fails on Vercel?**
- Check that all environment variables are set
- Review build logs for specific errors
- Ensure Node.js version is 20+

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and for personal use.

## Support

For issues or questions:
- Check the Issues tab on GitHub
- Review the Supabase and Next.js documentation
- Verify all environment variables are correctly set

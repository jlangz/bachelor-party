# Bachelor Party Website Setup Guide

## 1. Supabase Setup

### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login (free account, no credit card needed)
3. Click "New Project"
4. Fill in:
   - **Name**: bachelor-party (or whatever you want)
   - **Database Password**: Save this somewhere safe
   - **Region**: Choose closest to Las Vegas (e.g., West US)
5. Wait 2-3 minutes for project creation

### Run Database Schema
1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

### Get Your API Keys
1. Go to **Settings** (gear icon in sidebar) → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

## 2. Environment Variables Setup

1. Create a file called `.env.local` in the project root (bachelor-party folder)
2. Copy the contents of `.env.local.example`
3. Fill in your values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-very-long-anon-key
ADMIN_PASSWORD=pickasecretpassword
```

## 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 4. Deploy to Vercel

### Option A: Via GitHub (Recommended)
1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Add the environment variables from `.env.local`
6. Click "Deploy"

### Option B: Via Vercel CLI
```bash
npm i -g vercel
vercel
```
Follow the prompts and add your environment variables when asked.

## 5. Share with Guests

Once deployed, you'll get a URL like: `https://bachelor-party.vercel.app`

Share this link with your bachelor party guests!

## Admin Access

Access the admin panel at `/admin` and use the password you set in `ADMIN_PASSWORD`.

# Quick Start Guide - 5 Minutes to Launch

Get your bachelor party website running in 5 minutes!

## ✅ Prerequisites Check

You already have:
- ✅ Next.js project installed
- ✅ Supabase credentials in `.env.local`
- ✅ Database schema ready to run

## 🚀 3 Simple Steps

### Step 1: Set Up Your Database (2 minutes)

1. Go to your Supabase project: https://supabase.com/dashboard/project/ehpotmhyvjesieavpkjg

2. Click **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy ALL the contents from `supabase-schema.sql` and paste into the editor

5. Click **Run** (or press Ctrl+Enter)

6. You should see: ✅ **"Success. No rows returned"**

**That's it!** Your database is ready.

### Step 2: Test Locally (1 minute)

Your dev server is already running at: **http://localhost:3000**

1. Open http://localhost:3000 in your browser

2. You should see the login page with "Jakob's Bachelor Party"

3. Test it:
   - Enter a phone number (e.g., 5551234567)
   - Enter your name
   - Click "Join the Party"
   - You should be redirected to the dashboard!

4. Navigate around and test the pages:
   - Dashboard ✓
   - Event Info ✓
   - RSVP ✓
   - Activities ✓
   - Admin (password: `admin123`) ✓

### Step 3: Deploy to Vercel (2 minutes)

#### Option A: Via Website (Easiest)

1. Go to https://vercel.com and sign in

2. Click **"New Project"**

3. Click **"Import Git Repository"** and select your project
   (If not on GitHub yet, run: `git init && git add . && git commit -m "Initial commit"` and push to GitHub first)

4. Add these 3 environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ehpotmhyvjesieavpkjg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocG90bWh5dmplc2llYXZwa2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNzM5MzAsImV4cCI6MjA3NTc0OTkzMH0.zYEul8KkljtozKFD-KIruNFErZ0-5SYyulNkYimA0bk
   NEXT_PUBLIC_ADMIN_PASSWORD=admin123
   ```
   (Change the admin password to something secure!)

5. Click **Deploy**

6. Wait 2 minutes... ☕

7. **Done!** 🎉 Your site is live at `https://your-project.vercel.app`

#### Option B: Via CLI (for developers)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd bachelor-party
vercel

# Add environment variables when prompted:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_ADMIN_PASSWORD

# Deploy to production
vercel --prod
```

## 📱 Share with Your Friends

Copy this message and send to your bachelor party group:

```
🎉 Jakob's Bachelor Party Website is Live! 🎉

We've set up a website for the Vegas bachelor party (Nov 14-16).

👉 Visit: [YOUR-VERCEL-URL]

What you can do:
✅ RSVP if you're coming
✅ Reserve a house bed (only 2 left!)
✅ Sign up for shooting range ($100-150)
✅ Sign up for Empire Strips Back show ($50-80)
✅ View the full weekend schedule

⏰ Please RSVP by October 15th so we can book everything!

See you in Vegas! 🎰🍾
```

## 🔑 Admin Access

To view all RSVPs and export data:

1. Go to `/admin` on your website
2. Enter password: `admin123` (or whatever you set)
3. View all responses, statistics, and export to CSV

## 🎯 What's Next?

**Week 1:**
- Share the website link
- Monitor RSVPs in admin panel
- Follow up with non-responders

**2 Weeks Before Event:**
- Export final list from admin panel
- Book shooting range for confirmed participants
- Buy show tickets for everyone who signed up

**During Event:**
- Have fun! 🎉
- Take photos
- Make memories

## 📞 Need Help?

Check these files in your project:
- `README.md` - Full project overview
- `SETUP.md` - Detailed setup instructions
- `DEPLOYMENT.md` - Deployment troubleshooting
- `PROJECT-SUMMARY.md` - Complete technical details

## Common Issues

**"Missing Supabase environment variables"**
→ Make sure you ran the SQL schema in Supabase

**"Build failed"**
→ Check that all environment variables are set in Vercel

**Can't log in**
→ Check browser console, verify Supabase is active

**Admin password doesn't work**
→ Clear browser storage, try incognito mode

---

## 🎊 You're All Set!

Your bachelor party website is:
- ✅ Built and tested
- ✅ Connected to database
- ✅ Deployed to the internet
- ✅ Ready for guests

**Enjoy the party! 🥳**

---

*P.S. Don't forget to change the admin password to something secure before sharing the website!*

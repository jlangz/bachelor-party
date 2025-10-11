# Deployment Guide

## Prerequisites

Before deploying, make sure you've completed the Supabase setup:

1. ✅ Created a Supabase project
2. ✅ Run the SQL schema from `supabase-schema.sql`
3. ✅ Updated `.env.local` with your Supabase credentials

## Deploy to Vercel (Recommended)

Vercel provides free hosting for Next.js apps with excellent performance.

### Option 1: Deploy via GitHub (Easiest)

1. **Create a GitHub Repository**
   ```bash
   cd bachelor-party
   git init
   git add .
   git commit -m "Initial commit - Jakob's bachelor party website"
   ```

2. **Push to GitHub**
   - Create a new repository on GitHub
   - Follow GitHub's instructions to push your code

3. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your bachelor-party repository
   - Configure environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://ehpotmhyvjesieavpkjg.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
     ```
   - Click "Deploy"

4. **Done!** Your site will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   cd bachelor-party
   vercel
   ```

4. **Add Environment Variables**
   When prompted, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`

5. **Confirm Production Deployment**
   ```bash
   vercel --prod
   ```

## Post-Deployment

### 1. Test the Website

Visit your live URL and test:
- [ ] Login with a phone number
- [ ] Create a new account
- [ ] Navigate to all pages (Dashboard, Info, RSVP, Activities)
- [ ] Submit an RSVP
- [ ] Sign up for activities
- [ ] Access admin panel (use your admin password)
- [ ] Export CSV from admin panel

### 2. Share with Guests

Once everything works:
1. Share the URL with your bachelor party guests
2. Send a message like:

```
Hey guys! We've set up a website for Jakob's bachelor party in Vegas (Nov 14-16).

Visit: https://your-project.vercel.app

You can:
- RSVP if you're coming
- Reserve a house bed (limited spots!)
- Sign up for shooting range & Empire Strips Back show
- View the full weekend schedule

Please RSVP by October 15th so we can book everything!
```

### 3. Monitor RSVPs

- Log in to the admin panel regularly
- Check `/admin` to see who's RSVPed
- Export CSV for your records
- Follow up with people who haven't responded

## Updating the Website

If you need to make changes after deployment:

### Via GitHub (if using Option 1)
```bash
# Make your changes
git add .
git commit -m "Update event details"
git push origin main
```
Vercel will automatically redeploy!

### Via Vercel CLI
```bash
# Make your changes
vercel --prod
```

## Custom Domain (Optional)

Want a custom domain like `jakobs-bachelor-party.com`?

1. Buy a domain (from Namecheap, GoDaddy, etc.)
2. Go to your Vercel project settings
3. Click "Domains"
4. Add your custom domain
5. Follow Vercel's DNS configuration instructions

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure you've added all environment variables in Vercel settings
- Redeploy after adding variables

### Database connection errors
- Verify your Supabase URL and anon key are correct
- Check that you've run the SQL schema in Supabase
- Ensure Supabase project is active (not paused)

### Build failures
- Check the Vercel build logs
- Make sure all dependencies are in `package.json`
- Verify TypeScript has no errors locally

### Admin panel not working
- Make sure `NEXT_PUBLIC_ADMIN_PASSWORD` is set
- Clear browser cache and sessionStorage
- Try incognito/private browsing mode

## Cost Breakdown

**Total Cost: $0/month** (on free tiers)

- **Vercel**: Free tier includes:
  - Unlimited deployments
  - Automatic HTTPS
  - Global CDN
  - 100GB bandwidth/month

- **Supabase**: Free tier includes:
  - 500MB database storage
  - Unlimited API requests
  - 50,000 monthly active users

Perfect for a bachelor party website! 🎉

## Security Best Practices

1. **Change the Admin Password**
   - Use a strong password in `NEXT_PUBLIC_ADMIN_PASSWORD`
   - Don't share it publicly

2. **Database Security**
   - Supabase RLS (Row Level Security) is enabled
   - Don't expose your service role key
   - Keep your anon key in environment variables

3. **Phone Number Privacy**
   - Phone numbers are stored securely in Supabase
   - Only visible in admin panel
   - No phone numbers are sent via SMS

## Need Help?

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Shadcn/ui Docs**: https://ui.shadcn.com

---

Good luck with the bachelor party! 🎰🍾

# GitHub Deployment Guide

This guide will help you deploy your ML-Powered Network Intrusion Detection System to GitHub and host it online.

## Prerequisites

- GitHub account
- Git installed on your computer
- Supabase account (free tier works)

## Step 1: Set Up Supabase

1. Go to https://supabase.com and create a new project
2. Wait for the project to be provisioned
3. Go to Project Settings > API
4. Copy your:
   - Project URL (SUPABASE_URL)
   - Anon/Public key (SUPABASE_ANON_KEY)

## Step 2: Configure Environment Variables Locally

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. Test locally:
   ```bash
   npm install
   npm run dev
   ```

## Step 3: Push to GitHub

1. Initialize Git repository (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: ML-Powered Network IDS"
   ```

2. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it `network-intrusion-detection-system` or your preferred name
   - Don't initialize with README (you already have one)
   - Click "Create repository"

3. Link and push to GitHub:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 4: Deploy to Vercel (Recommended)

1. Go to https://vercel.com and sign in with GitHub
2. Click "New Project"
3. Import your repository
4. Configure project:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy"
7. Your site will be live in ~2 minutes at `your-project.vercel.app`

## Step 5: Deploy to Netlify (Alternative)

1. Go to https://netlify.com and sign in with GitHub
2. Click "Add new site" > "Import an existing project"
3. Choose your GitHub repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
6. Click "Deploy site"
7. Your site will be live at `your-project.netlify.app`

## Step 6: Verify Deployment

1. Visit your deployed URL
2. Click "Start Monitoring"
3. Verify that:
   - Packets are being processed
   - Statistics are updating
   - Threats are being detected and displayed
   - Activity feed is showing real-time updates

## Troubleshooting

### "Failed to analyze packet" error
- Check that your Supabase Edge Function is deployed
- Verify your environment variables are correct
- Check Supabase logs for errors

### No data appearing
- Ensure environment variables are set in your hosting platform
- Check browser console for errors
- Verify Supabase database tables exist
- Check that RLS policies allow public read access

### Build fails
- Run `npm run build` locally to test
- Check for TypeScript errors
- Ensure all dependencies are in package.json

## Security Recommendations for Production

1. **Restrict Database Access**
   - Update RLS policies to require authentication
   - Implement user authentication with Supabase Auth
   - Remove public read access

2. **Add Rate Limiting**
   - Implement rate limiting on Edge Functions
   - Add request throttling for packet analysis

3. **Monitor Usage**
   - Set up Supabase usage alerts
   - Monitor database size and row counts
   - Track Edge Function invocations

4. **Secure Environment Variables**
   - Never commit `.env` to Git
   - Rotate keys periodically
   - Use separate projects for dev/prod

## Updating Your Deployment

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Both Vercel and Netlify will automatically redeploy when you push to GitHub.

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records as shown
4. SSL is automatic

### Netlify
1. Go to Site Settings > Domain Management
2. Add custom domain
3. Configure DNS records
4. SSL is automatic

## Support

For issues:
- Check Supabase logs for backend errors
- Check browser console for frontend errors
- Review RLS policies in Supabase
- Verify environment variables are set correctly

## Next Steps

- Add user authentication
- Implement incident management features
- Create email alerts for critical threats
- Add historical data analysis
- Integrate with SIEM platforms

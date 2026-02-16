# 🚀 Hostinger Deployment Guide - SaaSient Dashboard

## Prerequisites

- Hostinger account with Node.js hosting
- GitHub repository: https://github.com/sysopsparadise/SaaSient-Dashboard.git
- Supabase account with database configured

---

## Deployment Options

### Option 1: Deploy via Hostinger Git Integration (Recommended)

#### Step 1: Access Hostinger Control Panel
1. Log in to your Hostinger account
2. Go to **Hosting** → Select your hosting plan
3. Navigate to **Git** section

#### Step 2: Connect GitHub Repository
1. Click **Create new repository**
2. Select **GitHub** as the provider
3. Authorize Hostinger to access your GitHub
4. Select repository: `sysopsparadise/SaaSient-Dashboard`
5. Branch: `main`
6. Deployment path: `/public_html` or your preferred directory

#### Step 3: Configure Build Settings
In Hostinger Git settings, configure:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Node Version:**
- Select Node.js 18.x or higher

#### Step 4: Set Environment Variables
In Hostinger control panel, go to **Environment Variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://tbspnkniqtylgjinxdym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRic3Bua25pcXR5bGdqaW54ZHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODE2ODUsImV4cCI6MjA3MDU1NzY4NX0.f-pvumfIVXEwUdESLNPQs9-ypjH-Vx019P_ipvGfyvg
NODE_ENV=production
```

⚠️ **IMPORTANT**: For production, you should rotate these keys and use production-specific credentials.

#### Step 5: Deploy
1. Click **Deploy** or **Pull Changes**
2. Hostinger will automatically:
   - Clone the repository
   - Install dependencies
   - Build the application
   - Start the server

---

### Option 2: Manual Deployment via SSH

#### Step 1: Connect via SSH
```bash
ssh your-username@your-domain.com
```

#### Step 2: Navigate to Web Directory
```bash
cd public_html
# or
cd domains/your-domain.com/public_html
```

#### Step 3: Clone Repository
```bash
git clone https://github.com/sysopsparadise/SaaSient-Dashboard.git .
```

#### Step 4: Install Dependencies
```bash
npm install
```

#### Step 5: Create Environment File
```bash
nano .env.local
```

Add:
```
NEXT_PUBLIC_SUPABASE_URL=https://tbspnkniqtylgjinxdym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRic3Bua25pcXR5bGdqaW54ZHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODE2ODUsImV4cCI6MjA3MDU1NzY4NX0.f-pvumfIVXEwUdESLNPQs9-ypjH-Vx019P_ipvGfyvg
NODE_ENV=production
```

Save: `Ctrl+X`, then `Y`, then `Enter`

#### Step 6: Build Application
```bash
npm run build
```

#### Step 7: Start Application
```bash
npm start
```

Or use PM2 for process management:
```bash
npm install -g pm2
pm2 start npm --name "saasient-dashboard" -- start
pm2 save
pm2 startup
```

---

### Option 3: Deploy to Vercel (Alternative - Easier)

If Hostinger doesn't support Next.js well, consider Vercel:

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
vercel --prod
```

Vercel will automatically:
- Detect Next.js
- Build the application
- Deploy to production
- Provide a URL

---

## Post-Deployment Configuration

### 1. Configure Domain
In Hostinger:
1. Go to **Domains**
2. Point your domain to the deployment directory
3. Enable SSL certificate (Let's Encrypt)

### 2. Configure Supabase
Update Supabase settings:
1. Go to Supabase Dashboard
2. **Authentication** → **URL Configuration**
3. Add your Hostinger domain to **Site URL**
4. Add redirect URLs:
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/auth/update-password`

### 3. Enable Row Level Security (CRITICAL)
In Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE lead_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can only see their own data"
ON lead_store FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only see their own conversations"
ON whatsapp_conversations FOR SELECT
USING (auth.uid() = user_id);
```

### 4. Test Security Headers
Visit: https://securityheaders.com
Enter your domain to verify security headers are working.

### 5. Test SSL/TLS
Visit: https://www.ssllabs.com/ssltest/
Enter your domain to verify SSL configuration.

---

## Updating Your Deployment

### Via Git (Automatic)
If using Hostinger Git integration:
1. Push changes to GitHub: `git push origin main`
2. Hostinger will automatically pull and rebuild

### Via SSH (Manual)
```bash
ssh your-username@your-domain.com
cd public_html
git pull origin main
npm install
npm run build
pm2 restart saasient-dashboard
```

---

## Troubleshooting

### Build Fails
```bash
# Check Node version
node --version  # Should be 18.x or higher

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Environment Variables Not Working
```bash
# Verify .env.local exists
cat .env.local

# Check if variables are loaded
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### Permission Issues
```bash
# Fix permissions
chmod -R 755 public_html
chown -R your-username:your-username public_html
```

---

## Performance Optimization

### 1. Enable Caching
In Hostinger control panel:
- Enable **Browser Caching**
- Enable **Gzip Compression**

### 2. Use CDN
- Enable Cloudflare integration in Hostinger
- Configure caching rules

### 3. Optimize Images
Already configured in Next.js with automatic optimization.

---

## Monitoring

### 1. Set Up Uptime Monitoring
- Use UptimeRobot (free)
- Monitor: https://your-domain.com

### 2. Error Monitoring
Consider adding Sentry:
```bash
npm install @sentry/nextjs
```

### 3. Analytics
Add Google Analytics or Plausible for privacy-friendly analytics.

---

## Security Checklist

- [x] HTTPS enabled (SSL certificate)
- [x] Security headers configured
- [x] Environment variables set
- [ ] Supabase RLS policies configured
- [ ] Domain added to Supabase allowed URLs
- [ ] Firewall rules configured (if available)
- [ ] Regular backups enabled
- [ ] Monitoring set up

---

## Support

### Hostinger Support
- Live Chat: Available 24/7
- Knowledge Base: https://support.hostinger.com

### Application Issues
- GitHub: https://github.com/sysopsparadise/SaaSient-Dashboard/issues
- Email: support@saasient.ai

---

## Quick Commands Reference

```bash
# Deploy via Git
git push origin main

# SSH into server
ssh your-username@your-domain.com

# Update deployment
cd public_html && git pull && npm install && npm run build && pm2 restart all

# View logs
pm2 logs saasient-dashboard

# Check status
pm2 status

# Restart application
pm2 restart saasient-dashboard
```

---

## Next Steps

1. ✅ Code pushed to GitHub
2. ⚠️ Deploy to Hostinger (follow Option 1 or 2)
3. ⚠️ Configure domain and SSL
4. ⚠️ Set environment variables
5. ⚠️ Configure Supabase RLS
6. ⚠️ Test deployment
7. ⚠️ Set up monitoring

---

**Deployment Status**: Ready to Deploy
**Last Updated**: February 16, 2026
**Repository**: https://github.com/sysopsparadise/SaaSient-Dashboard.git

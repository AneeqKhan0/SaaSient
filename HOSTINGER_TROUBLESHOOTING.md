# 🔧 Hostinger Deployment Troubleshooting

## ✅ FIXED: Environment Variables Issue

### Problem
```
Error: supabaseUrl is required.
```

### Solution Applied
Created `.env.production` file with the required environment variables. This file is now committed to the repository and will be available during Hostinger build.

---

## 🚀 Deploy to Hostinger Now

### Step 1: Pull Latest Changes
In Hostinger control panel:
1. Go to **Git** section
2. Click **Pull Changes** or **Redeploy**
3. Hostinger will now find the `.env.production` file and build successfully

### Step 2: Verify Build
The build should now complete successfully with:
```
✓ Compiled successfully
✓ Finished TypeScript
✓ Collecting page data
✓ Generating static pages
✓ Build completed
```

---

## Alternative: Set Environment Variables in Hostinger UI

If you prefer not to commit environment variables to git, you can set them in Hostinger:

### Location 1: Git Settings
1. Hostinger Control Panel
2. **Git** → **Settings**
3. **Environment Variables** section
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://tbspnkniqtylgjinxdym.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `NODE_ENV` = `production`

### Location 2: Advanced Settings
1. Hostinger Control Panel
2. **Advanced** → **Environment Variables**
3. Add the same variables

---

## Common Hostinger Deployment Issues

### Issue 1: Build Fails - Missing Dependencies
**Error**: `Cannot find module 'xyz'`

**Solution**:
```bash
# SSH into server
ssh your-username@your-domain.com
cd public_html
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue 2: Port Already in Use
**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### Issue 3: Permission Denied
**Error**: `EACCES: permission denied`

**Solution**:
```bash
# Fix permissions
chmod -R 755 public_html
chown -R your-username:your-username public_html
```

### Issue 4: Build Timeout
**Error**: Build takes too long and times out

**Solution**:
- Increase build timeout in Hostinger settings
- Or build locally and deploy the `.next` folder:
```bash
# Local machine
npm run build
tar -czf build.tar.gz .next

# Upload to server and extract
scp build.tar.gz user@server:/path
ssh user@server
cd /path
tar -xzf build.tar.gz
```

### Issue 5: Node Version Mismatch
**Error**: `Unsupported Node.js version`

**Solution**:
1. Hostinger Control Panel
2. **Advanced** → **Node.js Version**
3. Select Node.js 18.x or higher

---

## Verify Deployment

### 1. Check Build Logs
In Hostinger Git section, view the deployment logs to ensure:
- ✓ Dependencies installed
- ✓ Build completed
- ✓ No errors

### 2. Test the Application
Visit your domain and test:
- [ ] Homepage loads
- [ ] Login page works
- [ ] Can log in with credentials
- [ ] Dashboard loads after login
- [ ] All pages accessible

### 3. Check Security Headers
Visit: https://securityheaders.com
Enter your domain to verify security headers are working.

### 4. Check SSL
Visit: https://www.ssllabs.com/ssltest/
Enter your domain to verify SSL configuration.

---

## Post-Deployment Checklist

- [ ] Application builds successfully
- [ ] Environment variables set
- [ ] Domain configured
- [ ] SSL certificate enabled
- [ ] Security headers verified
- [ ] Supabase RLS policies configured
- [ ] Supabase allowed URLs updated
- [ ] Test login/logout
- [ ] Test all pages
- [ ] Monitor error logs

---

## Hostinger-Specific Commands

### View Application Logs
```bash
ssh user@server
cd public_html
pm2 logs saasient-dashboard
```

### Restart Application
```bash
pm2 restart saasient-dashboard
```

### Check Application Status
```bash
pm2 status
```

### Update Application
```bash
cd public_html
git pull origin main
npm install
npm run build
pm2 restart saasient-dashboard
```

---

## Need Help?

### Hostinger Support
- **Live Chat**: 24/7 available in control panel
- **Knowledge Base**: https://support.hostinger.com
- **Email**: support@hostinger.com

### Application Issues
- **GitHub**: https://github.com/sysopsparadise/SaaSient-Dashboard/issues
- **Email**: support@saasient.ai

---

## Quick Deploy Command

After pushing to GitHub, run this in Hostinger SSH:

```bash
cd public_html && \
git pull origin main && \
npm install && \
npm run build && \
pm2 restart saasient-dashboard || npm start
```

---

## Environment Variables Reference

### Required Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tbspnkniqtylgjinxdym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRic3Bua25pcXR5bGdqaW54ZHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5ODE2ODUsImV4cCI6MjA3MDU1NzY4NX0.f-pvumfIVXEwUdESLNPQs9-ypjH-Vx019P_ipvGfyvg
NODE_ENV=production
```

### Optional Variables
```bash
PORT=3000
HOST=0.0.0.0
```

---

## Success Indicators

Your deployment is successful when you see:

1. ✅ Build completes without errors
2. ✅ Application starts on specified port
3. ✅ Homepage loads in browser
4. ✅ Can log in successfully
5. ✅ Dashboard displays data
6. ✅ No console errors in browser
7. ✅ Security headers present
8. ✅ SSL certificate valid

---

**Status**: Ready to Deploy
**Last Updated**: February 16, 2026
**Repository**: https://github.com/sysopsparadise/SaaSient-Dashboard.git

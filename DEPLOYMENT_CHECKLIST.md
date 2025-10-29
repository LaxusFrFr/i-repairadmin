# ✅ Hostinger Deployment Checklist

## Step 1: Choose Hosting Platform
- [ ] Select **"Other"** (best for React apps)
- [ ] Complete the setup wizard
- [ ] Reach hPanel/FTP access

## Step 2: Build Your React App
```bash
cd i-repair/admin
npm install
npm run build
```

## Step 3: Access File Manager
- [ ] Login to Hostinger dashboard
- [ ] Find "File Manager" or "FTP" option
- [ ] Open `public_html` folder

## Step 4: Upload Files
Upload ALL files from `i-repair/admin/build/`:
- [ ] index.html
- [ ] manifest.json
- [ ] robots.txt
- [ ] .htaccess
- [ ] static/ folder (entire folder)
- [ ] asset-manifest.json

## Step 5: Configure Domain
- [ ] Visit your domain: `i-repair.com`
- [ ] Check if SSL is enabled (https://)
- [ ] Test if site loads

## Step 6: Update Firebase
- [ ] Go to Firebase Console
- [ ] Project → Authentication → Settings
- [ ] Add to Authorized domains:
  - `i-repair.com`
  - `www.i-repair.com`

## Step 7: Test
- [ ] Can access admin site
- [ ] Can login
- [ ] Dashboard loads
- [ ] No console errors

## Common Access Points:
1. **hPanel** → **File Manager**
2. **FTP** → Use FileZilla/WinSCP
3. **Hosting** → **Manage** → **File Manager**

---
**Current Status:** Waiting for File Manager access






# 🚀 Deploy I-Repair Admin to Hostinger

## Step 1: Build the Production Files

```bash
# Navigate to admin directory
cd i-repair/admin

# Install dependencies if needed
npm install

# Build for production
npm run build
```

This creates a `build` folder with all optimized files.

---

## Step 2: Upload to Hostinger

### Via FTP/SFTP:
1. Get FTP credentials from Hostinger (Hosting → FTP Accounts)
2. Use FileZilla, WinSCP, or similar
3. Connect to your server
4. Navigate to `public_html`
5. Create a folder called `admin` (or use subdomain folder)
6. Upload ALL contents from `i-repair/admin/build/` to `public_html/admin/`

### Via Hostinger File Manager:
1. Login to Hostinger dashboard
2. Click **File Manager**
3. Navigate to `public_html`
4. Click **New Folder** → Name it `admin`
5. Upload all files from `build/` folder

---

## Step 3: Configure Subdomain (Optional but Recommended)

### In Hostinger Dashboard:
1. Go to **Domains** → **Subdomains**
2. Create subdomain: `admin` pointing to `public_html/admin`
3. Your admin panel will be at: `admin.yourdomain.com`

### Upload Files:
- Upload build files to `public_html/admin/`

---

## Step 4: Set Up `.htaccess` File

Copy the `.htaccess` file from `i-repair/admin/public/.htaccess` to your server's admin folder.

**Important:** Make sure the `.htaccess` file is in the root of your uploaded admin folder.

---

## Step 5: Configure Firebase

Since your app uses Firebase, ensure:

1. **Firebase project is configured correctly**
2. **Allowed domains** in Firebase Console:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Your Project → Authentication → Settings → Authorized domains
   - Add: `yourdomain.com`, `www.yourdomain.com`, `admin.yourdomain.com`

---

## Step 6: Test Your Deployment

Visit:
- `https://yourdomain.com/admin` (if using folder)
- OR `https://admin.yourdomain.com` (if using subdomain)

---

## 📁 Files to Upload

Upload **ALL** files from `i-repair/admin/build/`:

```
admin/
├── index.html
├── manifest.json
├── robots.txt
├── asset-manifest.json
├── static/
│   ├── css/
│   ├── js/
│   └── media/
└── .htaccess
```

---

## ⚠️ Important Notes

1. **Build before uploading** - Always run `npm run build` when making changes
2. **Environment variables** - May need to configure in Hostinger
3. **HTTPS** - Hostinger provides free SSL certificates
4. **File permissions** - Ensure folders have 755, files have 644 permissions

---

## 🔧 Troubleshooting

### Issue: Blank page after deployment
- **Solution:** Check if `.htaccess` is uploaded and configured correctly
- Check browser console for errors

### Issue: Assets not loading
- **Solution:** Clear browser cache, check if all files uploaded
- Verify file paths in `asset-manifest.json`

### Issue: Firebase errors
- **Solution:** Verify Firebase config in `firebase.ts`
- Check authorized domains in Firebase Console

---

## ✅ Deployment Checklist

- [ ] Run `npm run build` locally
- [ ] Upload all files from `build/` folder
- [ ] Upload `.htaccess` file
- [ ] Configure subdomain (optional)
- [ ] Update Firebase authorized domains
- [ ] Test login functionality
- [ ] Verify all routes work
- [ ] Check Firebase connection

---

## 🎯 Quick Commands

```bash
# Build for production
npm run build

# Preview build locally
npm install -g serve
serve -s build

# Check build size
cd build && du -sh *
```






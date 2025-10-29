# 📦 Build & Upload Your React App to Hostinger

## Step 1: Skip Website Migration

**In Hostinger Dashboard:**
- Click **"Skip"** or **"Not Now"** on the migration screen
- You don't need to migrate anything - you're creating a NEW site

---

## Step 2: Build Your React App

Open your terminal and run:

```bash
# Navigate to admin folder
cd i-repair/admin

# Install dependencies (if needed)
npm install

# Build for production
npm run build
```

This creates a `build` folder with all optimized files.

---

## Step 3: Access Hostinger File Manager

After completing the setup (skipping migration):

1. **Find File Manager:**
   - In Hostinger dashboard, click **"Websites"** or **"Hosting"**
   - Look for **"File Manager"** button

2. **Access public_html:**
   - Click on `public_html` folder
   - This is where your website files go

---

## Step 4: Upload Your Files

1. **Delete default files** (if any):
   - `index.html` (default Hostinger page)
   - Any other default files

2. **Upload your React files:**
   - From `i-repair/admin/build/` folder
   - Upload **ALL files and folders:**
     ```
     index.html
     manifest.json
     robots.txt
     static/ (folder)
     asset-manifest.json
     ```

3. **Upload .htaccess file:**
   - Copy from `i-repair/admin/public/.htaccess`
   - Upload to same location as index.html

**Upload Methods:**
- **Drag & Drop:** Drag files from your computer
- **Upload Button:** Click upload, select files
- **Compress & Extract:** Create .zip, upload, extract in Hostinger

---

## Step 5: Configure Domain

### Option A: Use Main Domain
- Your site: `yourdomain.com`
- Upload files directly to `public_html/`

### Option B: Create Subdomain (Recommended)
1. In Hostinger: **Domains** → **Subdomains**
2. Create: `admin` pointing to `public_html/admin`
3. Create folder: `admin` in File Manager
4. Upload files to `public_html/admin/`
5. Access at: `admin.yourdomain.com`

---

## Step 6: Update Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Your Project → **Authentication** → **Settings**
3. Click **Authorized domains**
4. Add your domains:
   - `yourdomain.com`
   - `www.yourdomain.com`
   - `admin.yourdomain.com` (if using subdomain)

---

## Step 7: Test Your Site

Visit your domain:
- `https://yourdomain.com`
- Or `https://admin.yourdomain.com`

**What to check:**
- ✅ Page loads correctly
- ✅ Login works
- ✅ Dashboard displays
- ✅ No console errors

---

## 🐛 Troubleshooting

### Blank white page?
- Check `.htaccess` is uploaded correctly
- Check browser console for errors
- Verify all files uploaded

### Assets not loading?
- Clear browser cache (Ctrl + F5)
- Check if all folders uploaded
- Verify paths in index.html

### Firebase errors?
- Check authorized domains in Firebase Console
- Verify Firebase config
- Check browser console for specific errors

### 404 errors on refresh?
- `.htaccess` must be in root folder
- Check File Manager permissions

---

## 📝 Notes

- **SSL Certificate:** Hostinger auto-installs SSL (HTTPS)
- **Domain:** Your site will be live at your purchased domain
- **Updates:** Re-upload files when you make changes
- **Backup:** Always keep a local copy of your files






# 🚀 Quick Deploy to Hostinger (1 Month Plan)

## Step 1: Build Your React App

```bash
# Navigate to admin folder
cd i-repair/admin

# Build for production
npm run build
```

This creates a `build` folder with all your files.

---

## Step 2: Upload to Hostinger

After purchasing your plan:

1. **Access Hostinger**
   - You'll receive an email with hosting details
   - Login at hostinger.com

2. **Go to File Manager**
   - In Hostinger dashboard
   - Click **Websites** → Your domain → **File Manager**
   - Or go directly to **hPanel** or **cPanel**

3. **Navigate to public_html**
   - Open the `public_html` folder
   - This is where your website files go

4. **Upload Files**
   - Click **Upload** button
   - Upload ALL files from `i-repair/admin/build/` folder:
     - index.html
     - manifest.json
     - robots.txt
     - All folders (static/, etc.)
   - Also upload `.htaccess` from `i-repair/admin/public/.htaccess`

---

## Step 3: Configure Your Site

### Access Your Site:
- Visit: `yourdomain.com` 
- Or: `yourdomain.com/admin` (if uploaded to a subfolder)

### Setup Subdomain (Optional but Recommended):
Create `admin.yourdomain.com`:
1. In Hostinger: **Domains** → **Subdomains**
2. Create: `admin` → Point to `public_html/admin`
3. Upload files to `public_html/admin/`

---

## Step 4: Update Firebase Settings

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Your Project → **Authentication** → **Settings** → **Authorized domains**
3. Add your domain:
   - `yourdomain.com`
   - `www.yourdomain.com`
   - `admin.yourdomain.com`

---

## ✅ Quick Checklist

- [ ] Build files: `npm run build`
- [ ] Upload all files to `public_html` or `public_html/admin`
- [ ] Upload `.htaccess` file
- [ ] Test site at your domain
- [ ] Update Firebase authorized domains
- [ ] Test login functionality

---

## 🔧 If Something Doesn't Work

### Blank Page?
- Check if `.htaccess` was uploaded correctly
- Check browser console for errors

### Assets Not Loading?
- Clear browser cache (Ctrl+F5)
- Verify all files uploaded correctly

### Firebase Errors?
- Check Firebase authorized domains
- Verify Firebase config in `firebase.ts`






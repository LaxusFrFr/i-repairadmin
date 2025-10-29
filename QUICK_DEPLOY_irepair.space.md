# 🚀 Quick Deploy to irepair.space

## Domain: irepair.space
Your website is set up in Hostinger! Now deploy your React admin app.

---

## Step 1: Build Your React App

Run this command:
```bash
cd i-repair/admin
npm run build
```

This creates optimized production files in the `build/` folder.

---

## Step 2: Access File Manager

1. **In Hostinger Dashboard:**
   - Click on **irepair.space** card
   - Look for **"File Manager"**, **"Manage"**, or **"hPanel"**
   - Open the file manager

2. **Navigate to:**
   - `public_html` folder
   - This is where your website files go

---

## Step 3: Upload Files

Upload **ALL files** from `i-repair/admin/build/`:
- index.html
- manifest.json  
- robots.txt
- asset-manifest.json
- .htaccess (from i-repair/admin/public/)
- static/ (entire folder with all contents)

**Upload Method:**
- **Drag & Drop:** Drag files from your computer
- **Upload Button:** Click upload, select files
- **Compress:** Create .zip, upload, extract in Hostinger

---

## Step 4: Delete Default Files

Before uploading, delete default files:
- `index.html` (Hostinger default page)
- Any other default files

---

## Step 5: Add Domain to Firebase

**Important:** Must do this before accessing your site!

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project: **i-repair-laxus**
3. **Authentication** → **Settings** → **Authorized domains**
4. Click **"Add domain"**
5. Add:
   - `irepair.space`
   - `www.irepair.space`

---

## Step 6: Test Your Site

Visit: `https://irepair.space`

**What to check:**
- ✅ Site loads
- ✅ Login page appears
- ✅ Can login with admin credentials
- ✅ Dashboard loads
- ✅ No console errors

---

## Expected Result

After uploading, your React admin app will be live at:
- **Main site:** `https://irepair.space`
- **SSL:** Already enabled (green padlock shown)

---

## Troubleshooting

**Blank page?**
- Check `.htaccess` uploaded correctly
- Clear browser cache

**Firebase errors?**
- Verify domain added to Firebase
- Check browser console

**Can't login?**
- Check Firebase authorized domains
- Verify Firebase config






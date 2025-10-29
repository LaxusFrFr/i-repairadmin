# 📁 How to Separate Admin Folder

## Step 1: Copy Admin Folder

**Current location:**
```
I-Repair/i-repair/admin
```

**New location options:**

### Option A: Move to Desktop (Easiest)
```
C:\Users\Laxus\Desktop\Admin-irepair\
```

### Option B: Move to Documents
```
C:\Users\Laxus\Documents\Admin-irepair\
```

---

## Step 2: Move the Folder

1. Open File Explorer
2. Navigate to: `C:\Users\Laxus\Documents\I-Repair\i-repair\`
3. Right-click on `admin` folder
4. Select **Cut** (or **Copy**)
5. Navigate to Desktop or Documents
6. Right-click → **Paste**

You now have: `C:\Users\Laxus\Desktop\admin` (or Documents)

---

## Step 3: Rebuild in New Location

1. Open terminal
2. Navigate to new location:
   ```bash
   cd C:\Users\Laxus\Desktop\admin
   ```

3. Install dependencies (if needed):
   ```bash
   npm install
   ```

4. Build:
   ```bash
   npm run build
   ```

5. Upload `build` folder to Hostinger

---

## ⚠️ Important Notes:

1. **Keep the original** until upload is successful (backup)
2. **Don't delete** from original location yet
3. **Test the build** works in new location first
4. **After confirming** it works, then you can delete from original

---

## Better Alternative:

**Just create a shortcut on Desktop** pointing to:
`C:\Users\Laxus\Documents\I-Repair\i-repair\admin`

This way you don't risk breaking anything!






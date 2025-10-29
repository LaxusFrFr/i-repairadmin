# 🔥 Add irepair.space to Firebase

## Step 1: Access Firebase Console

1. Go to: https://console.firebase.google.com/
2. Login with your Google account
3. Select project: **i-repair-laxus**

---

## Step 2: Add Authorized Domain

1. In Firebase Console, click **Authentication** (left sidebar)
2. Click **Settings** tab (top menu)
3. Scroll to **"Authorized domains"** section
4. Click **"Add domain"** button

### Add these domains:

#### First Domain:
- **Domain:** `irepair.space`
- Click **"Add"**

#### Second Domain:
- **Domain:** `www.irepair.space`
- Click **"Add"**

#### Optional (if you use subdomain later):
- **Domain:** `admin.irepair.space`
- Click **"Add"**

---

## Step 3: Verify Domains

After adding, you should see:
```
Authorized domains:
- localhost
- i-repair-laxus.firebaseapp.com
- irepair.space ← NEW
- www.irepair.space ← NEW
```

---

## ⚠️ Important

**Do this BEFORE deploying your site!**

If you don't add the domain:
- ❌ Login won't work
- ❌ Firebase will block authentication
- ❌ Error: "The domain is not authorized for OAuth"

---

## Current Status

Your Firebase config is in `i-repair/admin/src/firebase/firebase.ts`:
```typescript
authDomain: "i-repair-laxus.firebaseapp.com"
```

This is correct! Once you add `irepair.space` to authorized domains, it will work.

---

## Quick Checklist

- [ ] Login to Firebase Console
- [ ] Go to Authentication → Settings
- [ ] Add `irepair.space`
- [ ] Add `www.irepair.space`
- [ ] Verify domains appear in list
- [ ] Ready to deploy! ✅






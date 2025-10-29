# ❌ Files NOT to Upload to Hostinger

## DO NOT Upload These:

### Mobile App (Expo/React Native):
```
i-repair/app/
i-repair/android/
i-repair/assets/
i-repair/components/
i-repair/constants/
i-repair/contexts/
i-repair/eas.json
i-repair/expo-env.d.ts
i-repair/app.json
i-repair/metro.config.js
```

### Other Folders:
```
i-repair/functions/
i-repair/services/
i-repair/hooks/
i-repair/scripts/
i-repair/.git/
```

---

## ✅ ONLY Upload This:

After running `npm run build` in `i-repair/admin/`:

```
i-repair/admin/build/
├── index.html
├── manifest.json
├── robots.txt
├── asset-manifest.json
├── .htaccess
└── static/
    ├── css/
    ├── js/
    └── media/
```

**This is ALL you need!**

---

## Why?

- **Mobile app** → Goes to app stores (different deployment)
- **Admin web app** → Goes to Hostinger (what you're doing now)
- **Functions** → Deployed separately to Firebase Functions

Only the built admin web app runs in a browser at irepair.space






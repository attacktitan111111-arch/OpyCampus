# 📱 OpyCampus — Play Store Launch Guide

This guide walks you through launching OpyCampus on the Google Play Store. Follow each step in order.

---

## ✅ What's Already Done (By Your Developer)

- ✅ Full social platform built (feed, profiles, DMs, communities, institutions)
- ✅ Real authentication (signup/login with hashed passwords)
- ✅ Image & video upload support
- ✅ Legal pages (Terms of Service, Privacy Policy, Community Guidelines)
- ✅ PWA manifest (`public/manifest.json`)
- ✅ Service worker for offline support (`public/sw.js`)
- ✅ App icons (`public/icon-192.png`, `public/icon-512.png`)
- ✅ Supabase configuration code (ready to connect)
- ✅ TWA config file (`twa-config.json`)

---

## 🚀 Step 1: Deploy to Vercel (15 minutes)

### 1.1 Create a Vercel account
1. Go to **vercel.com** → click "Sign Up" → use GitHub or email
2. It's free

### 1.2 Push your code to GitHub
Ask your developer to push the code to a GitHub repository, OR:
1. Download the project as a ZIP
2. Create a new GitHub repo at **github.com/new**
3. Upload the files

### 1.3 Deploy on Vercel
1. Go to **vercel.com/new**
2. Click "Import Git Repository" → select your GitHub repo
3. Vercel auto-detects Next.js — keep the default settings
4. **IMPORTANT — Add Environment Variables** (click "Environment Variables"):
   - `DATABASE_URL` = `postgresql://postgres:xK2K23%2Af%3F%23TUQ%25j@db.fvxbigtrzdujxhmotewa.supabase.co:5432/postgres`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://fvxbigtrzdujxhmotewa.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGJpZ3RyemR1anhobW90ZXdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzY4NjEsImV4cCI6MjEwNTAxMjg2MX0.UtedyrFXY7LMb-LP-HUbjQD4GiZha4oa8JC9-CsPBgQ`
5. Click "Deploy"
6. Wait 2–3 minutes → you get a URL like `https://opycampus-xxx.vercel.app`

### 1.4 Switch to PostgreSQL for production
Before deploying, ask your developer to change `prisma/schema.prisma`:
```
provider = "postgresql"  // was "sqlite"
```
Then Vercel will use your Supabase database automatically.

### 1.5 Run the database migration
After the first deploy, run this once (from your local machine or Vercel CLI):
```bash
bun run db:push    # creates tables in Supabase
bun run db:seed    # adds demo data
```

---

## 📦 Step 2: Set Up Supabase Storage (5 minutes)

Your uploads need cloud storage (Vercel doesn't allow local file storage).

### 2.1 Create a storage bucket
1. Go to your Supabase dashboard → **Storage** (left sidebar)
2. Click **"New bucket"**
3. Name: `media` (exactly, lowercase)
4. Check **"Public bucket"** (so files are viewable)
5. Click **"Create bucket"**

That's it! The app code is already written to use this bucket automatically.

---

## 🌐 Step 3: Get a Custom Domain (optional but recommended)

### 3.1 Buy a domain
- Go to **namecheap.com** or **cloudflare.com**
- Search for `opycampus.app` or `opycampus.com`
- Buy it (~$10–15/year)

### 3.2 Connect to Vercel
1. In Vercel dashboard → your project → **Settings** → **Domains**
2. Click "Add Domain" → enter `opycampus.app`
3. Follow the DNS instructions (add a CNAME record to your domain registrar)
4. Wait 5–30 minutes for it to propagate

### 3.3 Update the TWA config
Edit `twa-config.json` — replace `opycampus.app` with your actual domain.

---

## 📱 Step 4: Build the Play Store App (TWA)

### 4.1 Install Bubblewrap (on your computer)
```bash
npm install -g @bubblewrap/cli
```

### 4.2 Initialize the TWA project
```bash
bubblewrap init --manifest=https://YOUR-DOMAIN.com/manifest.json
```
- This creates an Android project from your PWA
- Answer the prompts (package name: `app.opycampus`)

### 4.3 Build the AAB (Android App Bundle)
```bash
bubblewrap build
```
- This generates a signing key and builds `app-release-bundle.aab`
- **IMPORTANT:** Save the keystore file and password — you'll need it for all future updates

### 4.4 Test the APK on your phone
```bash
bubblewrap build --type=apk
```
- Install the APK on your Android phone
- Test that everything works (login, post, upload, DMs)

---

## 🏪 Step 5: Create Google Play Console Account

### 5.1 Sign up
1. Go to **play.google.com/console**
2. Sign in with your Google account
3. Pay the **$25 one-time registration fee**
4. Complete your developer profile (name, contact info)

### 5.2 Create a new app
1. Click **"Create app"**
2. App name: **OpyCampus**
3. Default language: English
4. App type: **App**
5. Free or paid: **Free**
6. Accept the declarations

---

## 📝 Step 6: Fill in the Store Listing

### 6.1 App details
| Field | Value |
|-------|-------|
| **App name** | OpyCampus |
| **Short description** | Campus social — for students, teachers & schools |
| **Full description** | (see below) |
| **App category** | Social |
| **Content rating** | Everyone / Teen (fill out the IARC questionnaire) |
| **Target audience** | 18+ (or 13+ with appropriate content) |

### 6.2 Full description (copy & paste this)
```
OpyCampus is a clean, minimal social platform built for students, teachers, and educational institutions.

✨ FEATURES
• Share thoughts, photos, and videos with your campus
• Follow classmates, teachers, and friends
• Join your school's private feed (verified members only)
• Create and join study groups, clubs, and course communities
• Direct message your connections
• Get notified when someone likes, replies, or follows you
• Discover trending topics and suggested people

🎓 BUILT FOR EDUCATION
• Verified institution feeds (school, college, university)
• Private study groups by subject or course
• Teacher and student roles
• Department and program tags

🔒 PRIVACY & SAFETY
• Private institution feeds only visible to verified members
• Report any post that violates community guidelines
• Full control over your profile and data
• No ads, no data selling

OpyCampus is where your campus comes together. Download now and join the conversation.
```

### 6.3 App screenshots
You need at least 2 screenshots (phone). Take these from the app:
1. Home feed (show posts)
2. Profile page
3. Compose / new post
4. Messages / DMs
5. Explore page

Use a tool like **screenshots.pro** or just take screenshots on your phone (1080x1920 PNG).

### 6.4 Privacy Policy URL
Enter: `https://YOUR-DOMAIN.com/legal?page=privacy`
(The app already has this page built in)

### 6.5 Terms of Service URL
Enter: `https://YOUR-DOMAIN.com/legal?page=terms`

### 6.6 Data Safety form
Google requires you to declare what data you collect. Fill it out:
- **Personal info**: Name, email address, username ✓
- **Photos and videos** ✓
- **App activity**: User-generated content ✓
- **Data is encrypted in transit** ✓
- **You can request data deletion** ✓

---

## 🚀 Step 7: Upload & Submit

### 7.1 Upload the AAB
1. In Play Console → **Production** → **Create release**
2. Upload the `app-release-bundle.aab` file
3. Add release notes: "Initial release of OpyCampus"
4. Click **Next** → **Review release**

### 7.2 Complete the app content section
Play Console will show a checklist. Complete each item:
- **App access**: Set to "All functionality available without restrictions"
- **Ads**: "No, my app does not contain ads"
- **Content rating**: Fill out the IARC questionnaire
- **Target audience**: Select 18+ (or 13+ if appropriate)
- **News app**: No
- **Government apps**: No
- **Data safety**: Fill out the data declaration
- **Privacy Policy**: Enter your privacy URL

### 7.3 Submit for review
1. Click **"Send for review"** at the bottom
2. Google reviews your app in **1–7 days**
3. You'll get an email when it's approved

### 7.4 After approval
- Your app is live on the Play Store! 🎉
- Share the link: `https://play.google.com/store/apps/details?id=app.opycampus`

---

## 🔄 Future Updates

To update the app:
1. Make code changes → deploy to Vercel
2. Update `appVersionCode` in `twa-config.json` (increase by 1)
3. Run `bubblewrap build` again
4. Upload the new AAB to Play Console → **Production** → **Create release**

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Upload doesn't work on Vercel | Make sure you created the `media` bucket in Supabase Storage and set it to public |
| App shows "can't reach database" | Your Supabase project might be paused. Go to Supabase dashboard → Settings → unpause |
| Play Store rejects "TWA not valid" | Make sure your manifest.json is accessible at `https://YOUR-DOMAIN/manifest.json` |
| Signature error | You must use the same keystore for all updates. Back up your `android.keystore` file! |

---

## 📞 Quick Reference

| What | Where |
|------|-------|
| Supabase dashboard | https://supabase.com/dashboard/project/fvxbigtrzdujxhmotewa |
| Vercel dashboard | https://vercel.com/dashboard |
| Play Console | https://play.google.com/console |
| Supabase Storage bucket | Storage → `media` (must be public) |
| Privacy Policy URL | `https://YOUR-DOMAIN/legal?page=privacy` |
| Terms URL | `https://YOUR-DOMAIN/legal?page=terms` |

---

## 🎯 Summary of What YOU Need to Do

1. **Create Vercel account** → deploy the app (add env vars)
2. **Create `media` bucket** in Supabase Storage (public)
3. **Buy a domain** (optional but recommended)
4. **Install Bubblewrap** → build AAB
5. **Create Play Console** ($25) → fill listing → upload AAB
6. **Submit** → wait 1–7 days → live!

Everything else is done. You're ready to launch. 🚀
